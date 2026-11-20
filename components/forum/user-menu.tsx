"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ShieldCheck, User, LogOut, BookOpen, Eye, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, Role } from "@/lib/auth";
import { SessionsPanel, useSessionReminders, type SessionSummary } from "@/components/forum/notification-bell";
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

export function ActivityBell({ sessions = [], joinedIds = new Set<number>() }: { sessions?: SessionSummary[]; joinedIds?: Set<number> }) {
  const { session } = useAuth();
  const [items, setItems] = useState<Awaited<ReturnType<typeof loadNotifications>>>([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"general" | "sessions">("general");
  const ref = useOutside(open, () => setOpen(false));
  const uid = session?.user.id;
  const { upcoming, urgentCount, badgeCount, handleSaveCalendar } = useSessionReminders({ sessions, joinedIds });

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    const run = () => loadNotifications().then((d) => alive && setItems(d)).catch(() => {});
    run();
    const t = setInterval(run, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [uid]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open]);

  const unread = items.filter((n) => !n.is_read).length;
  const total = unread + badgeCount;
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && tab === "general" && unread) markNotificationsRead().then(() => setTimeout(() => setItems((p) => p.map((n) => ({ ...n, is_read: true }))), 1500));
  };
  const pick = (t: "general" | "sessions") => {
    setTab(t);
    if (t === "general" && unread) markNotificationsRead().then(() => setTimeout(() => setItems((p) => p.map((n) => ({ ...n, is_read: true }))), 1500));
  };
  const tabCls = (active: boolean) => `flex-1 px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`;

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" aria-label={`การแจ้งเตือน (${total} รายการ)`} aria-expanded={open} onClick={toggle} className="relative">
        <Bell className={`w-5 h-5 ${urgentCount > 0 ? "animate-pulse" : ""}`} />
        {total > 0 && <span className={`absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full text-white text-[10px] flex items-center justify-center ${unread > 0 || urgentCount > 0 ? "bg-red-500" : "bg-teal-500"}`}>{total > 9 ? "9+" : total}</span>}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex border-b border-border bg-secondary/40" role="tablist">
            <button role="tab" aria-selected={tab === "general"} onClick={() => pick("general")} className={tabCls(tab === "general")}>
              การแจ้งเตือนทั่วไป{unread > 0 && <span className="ml-1.5 inline-flex min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] items-center justify-center">{unread}</span>}
            </button>
            <button role="tab" aria-selected={tab === "sessions"} onClick={() => pick("sessions")} className={tabCls(tab === "sessions")}>
              My Sessions{badgeCount > 0 && <span className="ml-1.5 inline-flex min-w-4 h-4 px-1 rounded-full bg-teal-500 text-white text-[10px] items-center justify-center">{badgeCount}</span>}
            </button>
          </div>
          {tab === "general" ? (
            <div className="max-h-[22rem] overflow-y-auto">
              {items.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">ยังไม่มีการแจ้งเตือน</div>}
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
          ) : (
            <SessionsPanel upcoming={upcoming} handleSaveCalendar={handleSaveCalendar} onNavigate={() => setOpen(false)} />
          )}
        </div>
      )}
    </div>
  );
}
