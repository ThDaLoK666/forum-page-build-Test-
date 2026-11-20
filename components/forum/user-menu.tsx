"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ShieldCheck, User, LogOut, BookOpen, Eye, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, Role } from "@/lib/auth";
import { loadNotifications, markNotificationsRead, timeAgo } from "@/lib/data";

const ROLE_LABEL: Record<Role, string> = { student: "นักศึกษา", ta: "TA", instructor: "อาจารย์", admin: "Admin" };

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, close]);
  return ref;
}

export function UserMenu() {
  const { profile, isAdmin, viewAs, setViewAs, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  if (!profile) return null;
  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" aria-label="เมนูผู้ใช้" onClick={() => setOpen((o) => !o)}>
        {profile.avatar_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
          : <User className="w-5 h-5" />}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-2 text-sm">
          <div className="px-3 py-2 border-b border-border mb-1">
            <div className="font-semibold truncate">{profile.display_name}</div>
            <div className="text-xs text-muted-foreground">{ROLE_LABEL[profile.role]}</div>
          </div>
          {isAdmin && (
            <div className="px-3 py-2 border-b border-border mb-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5"><Eye className="w-3 h-3" />ดูหน้าเว็บในมุมมองของ</div>
              <div className="grid grid-cols-2 gap-1">
                {(["student", "ta", "instructor", "admin"] as Role[]).map((r) => (
                  <button key={r} onClick={() => setViewAs(r)}
                    className={`px-2 py-1 rounded text-xs border ${viewAs === r ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}>
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-muted"><User className="w-4 h-4" />โปรไฟล์ของฉัน</Link>
          {isAdmin && <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-muted"><ShieldCheck className="w-4 h-4" />แผงผู้ดูแลระบบ</Link>}
          <Link href="/library" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-muted"><Library className="w-4 h-4" />คลังไฟล์ โค้ด ลิงก์</Link>
          <Link href="/guidelines" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-muted"><BookOpen className="w-4 h-4" />กฎการใช้งาน</Link>
          <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted text-left"><LogOut className="w-4 h-4" />ออกจากระบบ</button>
        </div>
      )}
    </div>
  );
}

const TEXT: Record<string, string> = {
  answer: "มีคนตอบกระทู้ของคุณ",
  reply: "มีคนตอบกลับความคิดเห็นของคุณ",
  accepted: "คำตอบของคุณถูกเลือกเป็นคำตอบที่ถูกต้อง",
  verified: "คำตอบของคุณได้รับการยืนยันจาก TA/อาจารย์",
  report: "มีรายงานเนื้อหาใหม่รอตรวจสอบ",
};

export function ActivityBell() {
  const { session } = useAuth();
  const [items, setItems] = useState<Awaited<ReturnType<typeof loadNotifications>>>([]);
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  const uid = session?.user.id;

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    const run = () => loadNotifications().then((d) => alive && setItems(d)).catch(() => {});
    run();
    const t = setInterval(run, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [uid]);

  const unread = items.filter((n) => !n.is_read).length;
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread) markNotificationsRead().then(() => setTimeout(() => setItems((p) => p.map((n) => ({ ...n, is_read: true }))), 1500));
  };

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" aria-label="การแจ้งเตือนกิจกรรม" onClick={toggle} className="relative">
        <Bell className="w-5 h-5" />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{unread}</span>}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-card border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-2 text-sm font-semibold border-b border-border">การแจ้งเตือน</div>
          {items.length === 0 && <div className="p-4 text-sm text-muted-foreground">ยังไม่มีการแจ้งเตือน</div>}
          {items.map((n) => {
            const href = n.question_id ? `/post/${n.question_id}` : n.type === "report" ? "/admin" : "#";
            return (
              <Link key={n.id} href={href} onClick={() => setOpen(false)} className={`block px-4 py-3 text-sm border-b border-border last:border-0 hover:bg-muted ${n.is_read ? "" : "bg-primary/5"}`}>
                <div>{TEXT[n.type] ?? n.type}</div>
                <div className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
