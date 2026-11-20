"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Code2, ExternalLink, FileText, Image as ImageIcon, Link2, Loader2, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/supabase";
import { LibraryItem, fmtSize, loadLibrary, loadSubjects, setFileCategory, signedUrl, SubjectRow } from "@/lib/data";

const TYPES = [["all", "ทั้งหมด"], ["file", "ไฟล์"], ["code", "โค้ด"], ["link", "ลิงก์"]] as const;
const CATS: Record<string, string> = {
  slides: "สไลด์", lecture_notes: "เอกสารประกอบการเรียน", lab: "แล็บ", assignment: "การบ้าน", exam: "ข้อสอบ", cheatsheet: "สรุป/Cheatsheet",
  image: "รูปภาพ", code_file: "ไฟล์โค้ด", other: "อื่น ๆ", code: "โค้ดในกระทู้", video: "วิดีโอ", repo: "Repository", doc: "เอกสารออนไลน์", article: "บทความ/เว็บ",
};

export default function LibraryPage() {
  const { uiRole } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<(typeof TYPES)[number][0]>("all");
  const [subject, setSubject] = useState("");
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");

  const load = () => Promise.all([loadLibrary(), loadSubjects()])
    .then(([i, s]) => { setItems(i); setSubjects(s); })
    .catch((e) => toast.error("โหลดคลังไม่สำเร็จ", { description: errMsg(e) }))
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const byType = useMemo(() => items.filter((i) => type === "all" || i.item_type === type), [items, type]);
  const cats = useMemo(() => [...new Set(byType.map((i) => i.category))], [byType]);
  const shown = byType.filter((i) =>
    (!subject || i.subject_code === subject) && (!cat || i.category === cat) &&
    (!q || (i.title + " " + (i.language ?? "")).toLowerCase().includes(q.toLowerCase())));

  const open = async (i: LibraryItem) => {
    try {
      if (i.item_type === "link" && i.url) window.open(i.url, "_blank", "noopener,noreferrer");
      else if (i.item_type === "file" && i.path) {
        if (i.path.startsWith("demo/")) return toast.info("เป็นไฟล์ตัวอย่างสำหรับสาธิต ไม่มีไฟล์จริงให้ดาวน์โหลด");
        window.open(await signedUrl(i.path, i.title), "_blank", "noopener");
      } else if (i.question_id) window.location.href = `/post/${i.question_id}`;
    } catch (e) { toast.error(errMsg(e)); }
  };
  const Icon = (i: LibraryItem) => i.item_type === "code" ? Code2 : i.item_type === "link" ? Link2 : i.category === "image" ? ImageIcon : FileText;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
        <Link href="/"><Button variant="ghost" size="icon" aria-label="กลับ"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="font-bold text-lg">คลังความรู้ (ไฟล์ โค้ด ลิงก์)</h1>
      </header>
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit flex-wrap">
          {TYPES.map(([t, l]) => (
            <button key={t} onClick={() => { setType(t); setCat(""); }} className={`px-4 py-1.5 text-sm rounded-md ${type === t ? "bg-card shadow font-medium" : "text-muted-foreground"}`}>
              {l} ({items.filter((i) => t === "all" || i.item_type === t).length})
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="ค้นหาชื่อไฟล์ / โค้ด / ลิงก์" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">ทุกวิชา</option>{subjects.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">ทุกหมวด</option>{cats.map((c) => <option key={c} value={c}>{CATS[c] ?? c}</option>)}
          </select>
        </div>
        {loading && <Loader2 className="w-6 h-6 animate-spin" />}
        {!loading && shown.length === 0 && <p className="text-muted-foreground text-sm">ไม่พบรายการ</p>}
        <div className="grid gap-2">
          {shown.map((i) => {
            const I = Icon(i);
            return (
              <div key={i.item_type + i.item_id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                <I className="w-5 h-5 text-muted-foreground shrink-0" />
                <button onClick={() => open(i)} className="flex-1 min-w-0 text-left">
                  <div className={`text-sm font-medium truncate ${i.item_type === "code" ? "font-mono" : ""}`}>{i.title}</div>
                  <div className="text-xs text-muted-foreground flex gap-2 flex-wrap">
                    <span>{i.subject_code}</span><span>· {CATS[i.category] ?? i.category}</span>
                    {i.language && <span>· {i.language}</span>}
                    {i.size_bytes ? <span>· {fmtSize(i.size_bytes)}</span> : null}
                    <span>· {new Date(i.created_at).toLocaleDateString("th-TH")}</span>
                  </div>
                </button>
                {i.is_pinned && <Pin className="w-4 h-4 text-amber-500" aria-label="ปักหมุด" />}
                {i.item_type === "file" && uiRole !== "student" && (
                  <select value={i.category} onChange={async (e) => { try { await setFileCategory(i.item_id, e.target.value); toast.success("เปลี่ยนหมวดแล้ว"); load(); } catch (er) { toast.error(errMsg(er)); } }}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                    {["slides", "lecture_notes", "lab", "assignment", "exam", "cheatsheet", "image", "code_file", "other"].map((c) => <option key={c} value={c}>{CATS[c]}</option>)}
                  </select>
                )}
                {i.item_type !== "file" && <Link href={`/post/${i.question_id}`} aria-label="ไปที่กระทู้"><ExternalLink className="w-4 h-4 text-muted-foreground" /></Link>}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
