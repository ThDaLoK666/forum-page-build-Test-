"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type VoteValue = 1 | -1 | 0;

// key format: "question:12" | "answer:34" | "reply:56" (reply == comment row)
const cache = new Map<string, VoteValue>();
let uid: string | null = null;

const parse = (key: string) => {
  const [t, id] = key.split(":");
  return { type: t === "reply" ? "comment" : t, id: Number(id) };
};
const emit = () => typeof window !== "undefined" && window.dispatchEvent(new CustomEvent("forum-votes-changed"));

export async function loadMyVotes(userId: string) {
  uid = userId;
  const { data } = await supabase.from("votes").select("target_type,target_id,value").eq("user_id", userId);
  cache.clear();
  (data ?? []).forEach((v: any) =>
    cache.set(`${v.target_type === "comment" ? "reply" : v.target_type}:${v.target_id}`, v.value as VoteValue)
  );
  emit();
}
export function clearMyVotes() { cache.clear(); uid = null; emit(); }

/** Current user's vote (loaded before posts are mapped, so base scores can exclude it). */
export function getStoredVote(key: string): VoteValue { return cache.get(key) ?? 0; }

export function useVote(key: string) {
  const [value, setValue] = useState<VoteValue>(0);
  useEffect(() => {
    const sync = () => setValue(cache.get(key) ?? 0);
    sync();
    window.addEventListener("forum-votes-changed", sync);
    return () => window.removeEventListener("forum-votes-changed", sync);
  }, [key]);

  const vote = useCallback((direction: 1 | -1) => {
    if (!uid) return 0;
    const current = cache.get(key) ?? 0;
    const next: VoteValue = current === direction ? 0 : direction;
    if (next === 0) cache.delete(key); else cache.set(key, next);
    setValue(next); emit();
    const { type, id } = parse(key);
    const req = next === 0
      ? supabase.from("votes").delete().eq("user_id", uid).eq("target_type", type).eq("target_id", id)
      : supabase.from("votes").upsert({ user_id: uid, target_type: type, target_id: id, value: next });
    req.then(({ error }) => {
      if (error) { // roll back
        if (current === 0) cache.delete(key); else cache.set(key, current);
        setValue(current); emit();
      }
    });
    return next - current;
  }, [key]);

  return { value, votedUp: value === 1, votedDown: value === -1, offset: value, vote };
}
