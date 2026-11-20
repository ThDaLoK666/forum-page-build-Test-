"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";

const PUBLIC = ["/login", "/reset-password", "/guidelines"];

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC.some((p) => path === p);

  useEffect(() => {
    if (loading) return;
    if (!session && !isPublic) router.replace("/login");
    if (session && path === "/login") router.replace("/");
  }, [loading, session, isPublic, path, router]);

  if (loading || (!session && !isPublic) || (session && path === "/login")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <>
      {profile?.is_suspended && (
        <div className="bg-destructive text-destructive-foreground text-sm px-4 py-2 flex items-center gap-2 justify-center">
          <ShieldAlert className="w-4 h-4" />
          บัญชีของคุณถูกระงับ คุณอ่านได้อย่างเดียวและโพสต์/ตอบไม่ได้ ติดต่อผู้ดูแลระบบหากต้องการความช่วยเหลือ
        </div>
      )}
      {children}
    </>
  );
}
