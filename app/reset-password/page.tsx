"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase, errMsg } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((evt) => { if (evt === "PASSWORD_RECOVERY" || evt === "SIGNED_IN") setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success("เปลี่ยนรหัสผ่านแล้ว");
    router.replace("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <form onSubmit={save} className="w-full max-w-sm bg-card border border-border rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-bold">ตั้งรหัสผ่านใหม่</h1>
        {!ready && <p className="text-sm text-muted-foreground">กำลังตรวจลิงก์... ถ้าไม่ขึ้น ให้เปิดลิงก์จากอีเมลอีกครั้ง</p>}
        <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)" disabled={!ready} />
        <Button type="submit" className="w-full" disabled={!ready || busy}>บันทึก</Button>
      </form>
    </div>
  );
}
