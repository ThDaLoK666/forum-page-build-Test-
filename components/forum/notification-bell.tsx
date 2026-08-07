"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarPlus,
  Clock,
  MapPin,
  ExternalLink,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sessionCountdown, downloadIcs, googleCalendarUrl } from "@/lib/calendar";
import { useClientTime } from "@/lib/use-client-time";
import { toast } from "sonner";

export interface SessionSummary {
  id: number;
  title: string;
  subject: string;
  sessionDate?: string;
  sessionTime?: string;
  sessionLocation?: string;
  sessionLink?: string;
  description?: string;
}

interface NotificationBellProps {
  sessions: SessionSummary[];
  joinedIds: Set<number>;
}

/**
 * Bell in the header. Lists the study sessions the user has joined,
 * sorted by how soon they start, with reminders for anything within 24h.
 */
export function NotificationBell({ sessions, joinedIds }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  // null until mounted — keeps SSR and client markup identical, then ticks
  const now = useClientTime();

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const joinedSessions = useMemo(() => {
    if (now === null) return [];
    return sessions
      .filter((s) => joinedIds.has(s.id))
      .map((s) => ({ ...s, countdown: sessionCountdown(s.sessionDate, s.sessionTime) }))
      .sort((a, b) => (a.countdown?.diff ?? Infinity) - (b.countdown?.diff ?? Infinity));
  }, [sessions, joinedIds, now]);

  const upcoming = joinedSessions.filter((s) => !s.countdown?.isPast);
  // Anything starting within 24 hours counts as an active reminder
  const urgentCount = upcoming.filter(
    (s) => s.countdown && s.countdown.diff <= 24 * 60 * 60 * 1000
  ).length;
  const badgeCount = upcoming.length;

  const handleSaveCalendar = (s: SessionSummary) => {
    const ok = downloadIcs({
      title: s.title,
      description: s.description,
      location: s.sessionLocation,
      date: s.sessionDate,
      time: s.sessionTime,
      url: s.sessionLink,
    });
    if (ok) {
      toast.success("บันทึกลงปฏิทินแล้ว", {
        description: "ไฟล์ .ics ถูกดาวน์โหลด — เปิดเพื่อเพิ่มลงปฏิทินของคุณ",
      });
    } else {
      toast.error("บันทึกไม่สำเร็จ", { description: "กระทู้นี้ยังไม่ได้ระบุวันที่นัดติว" });
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((o) => !o)}
        aria-label={`การแจ้งเตือน (${badgeCount} รายการ)`}
        aria-expanded={open}
      >
        <Bell className={cn("w-5 h-5", urgentCount > 0 && "animate-pulse")} />
        {badgeCount > 0 && (
          <span
            className={cn(
              "absolute top-1 right-1 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center",
              urgentCount > 0 ? "bg-red-500" : "bg-teal-500"
            )}
          >
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/40">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-bold text-foreground">My Sessions</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {upcoming.length} นัดที่กำลังจะถึง
            </span>
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {upcoming.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-sm font-medium text-foreground mb-1">ยังไม่มีนัดติว</p>
                <p className="text-xs text-muted-foreground">
                  กด Join Session บนกระทู้นัดติวเพื่อรับการแจ้งเตือน
                </p>
              </div>
            ) : (
              upcoming.map((s) => {
                const isUrgent = s.countdown?.isUrgent;
                const gcal = googleCalendarUrl({
                  title: s.title,
                  description: s.description,
                  location: s.sessionLocation,
                  date: s.sessionDate,
                  time: s.sessionTime,
                  url: s.sessionLink,
                });

                return (
                  <div
                    key={s.id}
                    className={cn(
                      "px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors",
                      isUrgent && "bg-red-50/60 dark:bg-red-950/10"
                    )}
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <Link
                        href={`/post/${s.id}`}
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium text-foreground hover:text-primary leading-tight line-clamp-2"
                      >
                        {s.title}
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2 pl-6">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.sessionDate} · {s.sessionTime}
                      </span>
                      {s.sessionLocation && (
                        <span className="flex items-center gap-1 truncate max-w-[10rem]">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {s.sessionLocation}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pl-6">
                      {s.countdown && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[11px] font-bold",
                            isUrgent
                              ? "bg-red-100 text-red-600 animate-pulse"
                              : "bg-teal-100 text-teal-700"
                          )}
                        >
                          อีก {s.countdown.text}
                        </span>
                      )}
                      <button
                        onClick={() => handleSaveCalendar(s)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="บันทึกลงปฏิทิน (.ics)"
                      >
                        <CalendarPlus className="w-3 h-3" />
                        ปฏิทิน
                      </button>
                      {gcal && (
                        <a
                          href={gcal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="เพิ่มลง Google Calendar"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Google
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {upcoming.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-secondary/30 text-[11px] text-muted-foreground text-center">
              ระบบจะเตือนอัตโนมัติเมื่อเหลือเวลาน้อยกว่า 24 ชั่วโมง
            </div>
          )}
        </div>
      )}
    </div>
  );
}
