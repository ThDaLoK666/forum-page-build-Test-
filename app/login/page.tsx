"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, errMsg } from "@/lib/supabase";

type Mode = "login" | "register" | "forgot";
const MAHIDOL = /@(student\.)?mahidol\.(edu|ac\.th)$/i;

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("");
    const em = email.trim().toLowerCase();
    if (mode !== "login" && !MAHIDOL.test(em) && em !== "drakyu666@gmail.com") {
      toast.error("ใช้ได้เฉพาะอีเมลมหิดล (@student.mahidol.edu, @mahidol.edu, @mahidol.ac.th)");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password });
        if (error) throw error;
      } else if (mode === "register") {
        if (password.length < 8) throw new Error("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
        if (!name.trim()) throw new Error("กรุณากรอกชื่อที่ใช้แสดง");
        const { data, error } = await supabase.auth.signUp({
          email: em, password,
          options: { data: { display_name: name.trim(), year: year || "" }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setNotice("สมัครสำเร็จ กรุณาตรวจอีเมลเพื่อกดลิงก์ยืนยัน แล้วกลับมาเข้าสู่ระบบ (ดูในโฟลเดอร์ Junk ด้วย)");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice("ถ้าอีเมลนี้มีบัญชี เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ให้แล้ว");
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-teal-50 dark:to-teal-950/20 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-3">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">ICT Learning Support Forum</h1>
          <p className="text-sm text-muted-foreground mt-1">เว็บบอร์ดถาม-ตอบสำหรับนักศึกษา ICT มหาวิทยาลัยมหิดล</p>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg mb-5">
          {(["login", "register"] as Mode[]).map((m) => (
            <button key={m} type="button" onClick={() => { setMode(m); setNotice(""); }}
              className={`py-2 text-sm rounded-md font-medium transition ${mode === m ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}>
              {m === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="name">ชื่อที่ใช้แสดง</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น Napaphat N." maxLength={60} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year">ชั้นปี (ไม่บังคับ)</Label>
                <select id="year" value={year} onChange={(e) => setYear(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">ไม่ระบุ</option>
                  {[1, 2, 3, 4].map((y) => <option key={y} value={y}>ปี {y}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">อีเมลมหิดล</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@student.mahidol.edu" required />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="pw">รหัสผ่าน</Label>
              <Input id="pw" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" required />
            </div>
          )}
          {notice && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3">{notice}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {mode === "login" ? "เข้าสู่ระบบ" : mode === "register" ? "สมัครสมาชิก" : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
          {mode === "login" && <button type="button" className="underline" onClick={() => setMode("forgot")}>ลืมรหัสผ่าน?</button>}
          {mode === "forgot" && <button type="button" className="underline" onClick={() => setMode("login")}>กลับไปเข้าสู่ระบบ</button>}
          <p>
            การใช้งานถือว่ายอมรับ <Link href="/guidelines" className="underline">กฎการใช้งาน</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
