"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/supabase";
import { loadSubjects, loadMySubjects, saveMySubjects, updateProfile, SubjectRow } from "@/lib/data";

export default function ProfilePage() {
  const { profile, session, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [dept, setDept] = useState("");
  const [avatar, setAvatar] = useState("");
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [mine, setMine] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.display_name); setYear(profile.year ? String(profile.year) : "");
    setDept(profile.department ?? ""); setAvatar(profile.avatar_url ?? "");
    Promise.all([loadSubjects(), loadMySubjects(profile.id)]).then(([s, m]) => { setSubjects(s); setMine(m); }).catch(() => {});
  }, [profile]);

  if (!profile) return null;
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("กรุณากรอกชื่อที่ใช้แสดง");
    if (avatar && !/^https?:\/\//i.test(avatar)) return toast.error("ลิงก์รูปต้องขึ้นต้นด้วย http(s)://");
    setBusy(true);
    try {
      await updateProfile(profile.id, { display_name: name.trim(), year: year ? Number(year) : null, department: dept.trim() || null, avatar_url: avatar.trim() || null });
      await saveMySubjects(profile.id, mine);
      await refreshProfile();
      toast.success("บันทึกโปรไฟล์แล้ว");
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const roleLabel = { student: "นักศึกษา", ta: "TA", instructor: "อาจารย์", admin: "ผู้ดูแลระบบ" }[profile.role];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
        <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="font-bold text-lg">โปรไฟล์ของฉัน</h1>
      </header>
      <main className="max-w-xl mx-auto p-4 sm:p-6">
        <form onSubmit={save} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="text-sm text-muted-foreground">
            <div>อีเมล: <span className="text-foreground">{session?.user.email}</span></div>
            <div>บทบาท: <span className="text-foreground font-medium">{roleLabel}</span></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="n">ชื่อที่ใช้แสดง</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="y">ชั้นปี</Label>
              <select id="y" value={year} onChange={(e) => setYear(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">ไม่ระบุ</option>{[1, 2, 3, 4].map((y) => <option key={y} value={y}>ปี {y}</option>)}
              </select></div>
            <div className="space-y-1.5"><Label htmlFor="d">สาขา</Label><Input id="d" value={dept} onChange={(e) => setDept(e.target.value)} placeholder="เช่น ICT" maxLength={60} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="a">ลิงก์รูปโปรไฟล์ (ไม่บังคับ)</Label><Input id="a" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." /></div>
          <div className="space-y-2">
            <Label>วิชาของฉัน (My Subjects)</Label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => {
                const on = mine.includes(s.code);
                return (
                  <button key={s.code} type="button" onClick={() => setMine(on ? mine.filter((c) => c !== s.code) : [...mine, s.code])}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${on ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}>
                    {s.code}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}บันทึก</Button>
            <Button type="button" variant="outline" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />ออกจากระบบ</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
