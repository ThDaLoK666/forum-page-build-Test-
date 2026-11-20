"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { errMsg, supabase } from "@/lib/supabase";
import * as D from "@/lib/data";

type Tab = "reports" | "users" | "identity";

export default function AdminPage() {
  const { isAdmin, profile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("reports");
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [log, setLog] = useState<any[]>([]);
  const [anon, setAnon] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [qid, setQid] = useState("");
  const [reason, setReason] = useState("");
  const [revealed, setRevealed] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [s, r, u, l] = await Promise.all([D.adminStats(), D.adminReports(), D.listUsers(), D.identityLog()]);
      setStats(s); setReports(r); setUsers(u); setLog(l);
      const { data } = await supabase.from("question_feed").select("id,title,created_at").eq("is_anonymous", true).order("id", { ascending: false }).limit(50);
      setAnon(data ?? []);
    } catch (e) { toast.error(errMsg(e)); }
  }, []);

  useEffect(() => { if (!loading && !isAdmin) router.replace("/"); }, [loading, isAdmin, router]);
  useEffect(() => { if (isAdmin) reload(); }, [isAdmin, reload]);
  if (!isAdmin) return null;

  const act = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); await reload(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const reveal = async () => {
    if (!Number(qid) || !reason.trim()) return toast.error("กรอกเลขกระทู้และเหตุผล");
    setBusy(true);
    try { setRevealed(await D.revealAuthor(Number(qid), reason.trim())); toast.success("เปิดดูแล้ว (บันทึกลง log)"); await reload(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const shown = users.filter((u) => !q || u.display_name.toLowerCase().includes(q.toLowerCase()));
  const open = reports.filter((r) => r.status === "open").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
        <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="font-bold text-lg">แผงผู้ดูแลระบบ</h1>
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      </header>
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[["ผู้ใช้", stats.users], ["กระทู้", stats.questions], ["คำตอบ", stats.answers], ["รายงานรอตรวจ", stats.open_reports]].map(([l, v]) => (
              <div key={l as string} className="bg-card border border-border rounded-xl p-4"><div className="text-2xl font-bold">{v as number}</div><div className="text-xs text-muted-foreground">{l}</div></div>
            ))}
          </div>
        )}
        <div className="flex gap-2 border-b border-border">
          {([["reports", `รายงาน${open ? ` (${open})` : ""}`], ["users", "ผู้ใช้"], ["identity", "ตัวตนนิรนาม"]] as [Tab, string][]).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{l}</button>
          ))}
        </div>

        {tab === "reports" && (
          <div className="space-y-3">
            {reports.length === 0 && <p className="text-muted-foreground text-sm">ยังไม่มีรายงาน</p>}
            {reports.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2 py-0.5 rounded bg-muted">{r.target_type}</span>
                  <span className={`px-2 py-0.5 rounded ${r.status === "open" ? "bg-amber-100 text-amber-700" : "bg-muted"}`}>{r.status}</span>
                  <span className="text-muted-foreground">โดย {r.reporter} · {new Date(r.created_at).toLocaleString("th-TH")}</span>
                </div>
                <div className="text-sm"><b>เหตุผล:</b> {r.reason}</div>
                <div className="text-sm text-muted-foreground">เนื้อหา: {r.snippet ?? "(ถูกลบแล้ว)"}</div>
                <div className="flex gap-2 flex-wrap">
                  {r.question_id && <Link href={`/post/${r.question_id}`}><Button size="sm" variant="outline">ดูกระทู้</Button></Link>}
                  {r.status === "open" && (<>
                    <Button size="sm" variant="destructive" onClick={() => act(() => D.resolveReport(r.id, "hide"), "ซ่อนเนื้อหาแล้ว")}>ซ่อนเนื้อหา</Button>
                    <Button size="sm" variant="outline" onClick={() => act(() => D.resolveReport(r.id, "dismiss"), "ยกเลิกรายงานแล้ว")}>ไม่ผิดกฎ</Button>
                  </>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-3">
            <Input placeholder="ค้นหาชื่อ" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {shown.map((u) => (
                <div key={u.id} className="p-3 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[10rem]"><div className="font-medium text-sm">{u.display_name}</div>
                    <div className="text-xs text-muted-foreground">{u.is_suspended ? "ถูกระงับ" : "ปกติ"}</div></div>
                  <select value={u.role} disabled={u.id === profile?.id} onChange={(e) => act(() => D.setUserRole(u.id, e.target.value), "เปลี่ยนบทบาทแล้ว")}
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm">
                    <option value="student">นักศึกษา</option><option value="ta">TA</option><option value="instructor">อาจารย์</option><option value="admin">Admin</option>
                  </select>
                  <Button size="sm" variant={u.is_suspended ? "outline" : "destructive"} disabled={u.id === profile?.id}
                    onClick={() => act(() => D.setUserSuspended(u.id, !u.is_suspended), u.is_suspended ? "ปลดระงับแล้ว" : "ระงับแล้ว")}>
                    {u.is_suspended ? "ปลดระงับ" : "ระงับ"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "identity" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 font-medium"><EyeOff className="w-4 h-4" />เปิดดูตัวตนผู้ตั้งกระทู้ (ต้องระบุเหตุผล ทุกครั้งถูกบันทึก)</div>
              <div className="flex gap-2 flex-wrap">
                <Input className="w-32" placeholder="เลขกระทู้" value={qid} onChange={(e) => setQid(e.target.value)} />
                <Input className="flex-1 min-w-[12rem]" placeholder="เหตุผล เช่น ละเมิดกฎข้อ 1 ตามรายงาน #12" value={reason} onChange={(e) => setReason(e.target.value)} />
                <Button onClick={reveal}>เปิดดู</Button>
              </div>
              <div className="border border-border rounded-md divide-y divide-border max-h-56 overflow-y-auto">
                <div className="p-2 text-xs text-muted-foreground">กระทู้นิรนามทั้งหมด (กดเลือกเพื่อเติมเลขกระทู้)</div>
                {anon.length === 0 && <div className="p-2 text-sm text-muted-foreground">ยังไม่มีกระทู้นิรนาม</div>}
                {anon.map((a) => (
                  <button key={a.id} type="button" onClick={() => { setQid(String(a.id)); setRevealed(null); }} className={`w-full text-left p-2 text-sm hover:bg-muted ${String(a.id) === qid ? "bg-primary/10" : ""}`}>
                    <span className="text-muted-foreground">#{a.id}</span> {a.title}
                  </button>
                ))}
              </div>
              {revealed && <div className="text-sm bg-muted rounded-md p-3">ชื่อ: <b>{revealed.display_name}</b> · อีเมล: <b>{revealed.email}</b></div>}
            </div>
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              <div className="p-3 text-sm font-medium">บันทึกการเปิดดูล่าสุด</div>
              {log.length === 0 && <div className="p-3 text-sm text-muted-foreground">ยังไม่มี</div>}
              {log.map((l) => (
                <div key={l.id} className="p-3 text-sm">กระทู้ #{l.question_id} · โดย {l.admin_name} · {new Date(l.accessed_at).toLocaleString("th-TH")}<div className="text-muted-foreground">เหตุผล: {l.reason}</div></div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
