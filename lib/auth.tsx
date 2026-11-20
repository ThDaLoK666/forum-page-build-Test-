"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { loadMyVotes, clearMyVotes } from "@/lib/votes";

export type Role = "student" | "ta" | "instructor" | "admin";
export interface Profile {
  id: string;
  display_name: string;
  year: number | null;
  department: string | null;
  avatar_url: string | null;
  role: Role;
  is_suspended: boolean;
}

interface AuthValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  /** real role stored in the database */
  realRole: Role;
  /** role currently being previewed (admins can switch views) */
  viewAs: Role;
  setViewAs: (r: Role) => void;
  /** role mapped to what the existing UI components understand */
  uiRole: "student" | "ta" | "instructor";
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAsRaw, setViewAsState] = useState<Role | null>(null);

  const fetchProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile((data as Profile) ?? null);
    await loadMyVotes(uid);
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      if (data.session) await fetchProfile(data.session.user.id);
      if (alive) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      if (s) {
        // defer to avoid deadlocks inside the auth callback
        setTimeout(() => fetchProfile(s.user.id), 0);
      } else {
        setProfile(null);
        clearMyVotes();
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  useEffect(() => {
    try {
      const v = localStorage.getItem("viewAs") as Role | null;
      if (v) setViewAsState(v);
    } catch {}
  }, []);

  const realRole: Role = profile?.role ?? "student";
  const viewAs: Role = realRole === "admin" && viewAs_ok(viewAsRaw) ? (viewAsRaw as Role) : realRole;
  const setViewAs = useCallback((r: Role) => {
    setViewAsState(r);
    try { localStorage.setItem("viewAs", r); } catch {}
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      profile,
      loading,
      realRole,
      viewAs,
      setViewAs,
      uiRole: viewAs === "admin" ? "instructor" : viewAs,
      isAdmin: realRole === "admin",
      refreshProfile: async () => { if (session) await fetchProfile(session.user.id); },
      signOut: async () => { await supabase.auth.signOut(); },
    }),
    [session, profile, loading, realRole, viewAs, setViewAs, fetchProfile]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function viewAs_ok(v: Role | null) {
  return v === "student" || v === "ta" || v === "instructor" || v === "admin";
}
