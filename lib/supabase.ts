import { createClient } from "@supabase/supabase-js";

// Publishable (anon) key — safe to ship to the browser. Access is enforced by Row Level Security.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fjjzasqdmquryauxcgnp.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_pHnjSd8Xg1IC5XWAZ6DiJw_TJ9BHwlA";

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Turn a Supabase/Postgres error into a short Thai message. */
export function errMsg(e: unknown): string {
  const m = String((e as any)?.message ?? e ?? "");
  if (/personal data/i.test(m)) return "พบข้อมูลส่วนตัว (อีเมล เบอร์โทร หรือรหัสนักศึกษา) กรุณาลบออกก่อน";
  if (/session full/i.test(m)) return "กลุ่มติวนี้เต็มแล้ว";
  if (/Mahidol email/i.test(m)) return "สมัครได้เฉพาะอีเมลมหิดล";
  if (/not allowed|only .* can|admin only|row-level security|permission denied/i.test(m))
    return "คุณไม่มีสิทธิ์ทำรายการนี้ (บัญชีอาจถูกระงับ)";
  if (/Invalid login/i.test(m)) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  if (/Email not confirmed/i.test(m)) return "ยังไม่ได้ยืนยันอีเมล กรุณาตรวจกล่องจดหมาย";
  if (/already registered|already been registered/i.test(m)) return "อีเมลนี้สมัครไว้แล้ว";
  if (/rate limit/i.test(m)) return "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่";
  if (/Failed to fetch|NetworkError/i.test(m)) return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่";
  return m || "เกิดข้อผิดพลาด กรุณาลองใหม่";
}
