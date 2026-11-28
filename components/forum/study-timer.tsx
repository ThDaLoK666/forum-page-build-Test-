"use client";

// Floating task timer for RQ2 usability tests (LSF side).
// Hidden unless the tester opens any page with ?test=1 (stored in localStorage; ?test=0 turns it off).
// Records per task: result, seconds, searches, scrolls, clicks, page changes -> CSV download.

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const TASKS: [string, string][] = [
  ["F1", "หาลิงก์แบบสอบถามร่างแรก"],
  ["F2", "ระดับอารมณ์ใน Customer Journey ตกลงใช้กี่ระดับ อะไรบ้าง"],
  ["F3", "หาลิงก์ชีต Problem Statement"],
  ["F4", "หาข้อกำหนดการส่ง Pack of Research (รูปแบบไฟล์และกำหนดส่ง)"],
  ["F5", "อาจารย์ว่าอย่างไรเรื่อง competitor ที่เว็บปิดไปแล้ว"],
  ["F6", "หาลิงก์ Figma ของแอป"],
  ["F7", "หาไฟล์เทมเพลตทดสอบผู้ใช้ (.xlsx) ที่ส่งกันไว้"],
  ["F8", "หารูป wireframe หน้าแรก แล้วตอบว่าปุ่มหลักสีอะไร"],
  ["F9", "หาโค้ดค่าสีหลักของแอปเวอร์ชันสุดท้าย"],
  ["F10", "หารูปผลโหวตสีธีม แล้วตอบว่าสีม่วงได้กี่คะแนนจาก 10"],
  ["F11", "เปิดไฟล์เทมเพลต persona ที่ส่งไว้ต้นกุมภา"],
  ["F12", "กำหนดส่ง Case Scenario ล่าสุดคือเมื่อไหร่"],
  ["F13", "หาลิงก์สไลด์สรุป Software Design บทที่ 1-3"],
  ["F14", "หารูปไวท์บอร์ด user flow แล้วตอบว่ามีกี่ขั้น"],
];

type Stats = { searches: number; scrolls: number; clicks: number; pages: number };
type Row = [string, string, string, string, number, number, number, number, string];
const LS = { on: "lsf_test", res: "lsf_test_results", pid: "lsf_test_pid", run: "lsf_test_run" };
const zero = (): Stats => ({ searches: 0, scrolls: 0, clicks: 0, pages: 0 });

export function StudyTimer() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(true);
  const [pid, setPid] = useState("");
  const [task, setTask] = useState("F1");
  const [running, setRunning] = useState(false);
  const [secs, setSecs] = useState(0);
  const [msg, setMsg] = useState("");
  const [results, setResults] = useState<Row[]>([]);
  const t0 = useRef(0);
  const stats = useRef<Stats>(zero());
  const runningRef = useRef(false);
  const lastScroll = useRef(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstPath = useRef(true);

  // enable via ?test=1
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("test");
      if (q === "1") localStorage.setItem(LS.on, "1");
      if (q === "0") localStorage.removeItem(LS.on);
      setEnabled(localStorage.getItem(LS.on) === "1");
      setPid(localStorage.getItem(LS.pid) || "");
      setResults(JSON.parse(localStorage.getItem(LS.res) || "[]"));
      const run = JSON.parse(localStorage.getItem(LS.run) || "null");
      if (run) { // restore a running task after a full page reload
        t0.current = run.t0; stats.current = run.stats; setTask(run.task);
        runningRef.current = true; setRunning(true);
      }
    } catch { /* storage unavailable */ }
  }, []);

  const persistRun = useCallback((task_: string) => {
    try { localStorage.setItem(LS.run, JSON.stringify({ t0: t0.current, stats: stats.current, task: task_ })); } catch {}
  }, []);

  // count page changes while running
  useEffect(() => {
    if (firstPath.current) { firstPath.current = false; return; }
    if (runningRef.current) { stats.current.pages++; persistRun(task); }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // global listeners while running
  useEffect(() => {
    if (!enabled) return;
    const onClick = (e: MouseEvent) => {
      if (!runningRef.current) return;
      if ((e.target as HTMLElement)?.closest?.("[data-study-timer]")) return;
      stats.current.clicks++;
    };
    const onScroll = () => {
      if (!runningRef.current) return;
      const n = Date.now();
      if (n - lastScroll.current > 600) { stats.current.scrolls++; lastScroll.current = n; }
    };
    const onInput = (e: Event) => {
      if (!runningRef.current) return;
      const el = e.target as HTMLInputElement;
      if (!el || el.tagName !== "INPUT") return;
      const ph = (el.placeholder || "").toLowerCase();
      if (!(el.type === "search" || ph.includes("search") || ph.includes("ค้นหา"))) return;
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => { if (el.value.trim()) { stats.current.searches++; persistRun(task); } }, 900);
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("wheel", onScroll, true);
    document.addEventListener("input", onInput, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("wheel", onScroll, true);
      document.removeEventListener("input", onInput, true);
    };
  }, [enabled, task, persistRun]);

  // clock
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs(Math.floor((Date.now() - t0.current) / 1000)), 500);
    return () => clearInterval(id);
  }, [running]);

  const start = () => {
    if (!pid.trim()) { setMsg("ใส่รหัสผู้ทดสอบก่อน"); return; }
    try { localStorage.setItem(LS.pid, pid.trim()); } catch {}
    t0.current = Date.now(); stats.current = zero(); setSecs(0);
    runningRef.current = true; setRunning(true); setMsg("");
    persistRun(task);
  };

  const finish = (result: "found" | "gaveup") => {
    if (!runningRef.current) return;
    const s = stats.current;
    const row: Row = [pid.trim(), task, result, ((Date.now() - t0.current) / 1000).toFixed(1), s.searches, s.scrolls, s.clicks, s.pages, new Date().toISOString()];
    const next = [...results, row];
    setResults(next);
    try { localStorage.setItem(LS.res, JSON.stringify(next)); localStorage.removeItem(LS.run); } catch {}
    runningRef.current = false; setRunning(false);
    setMsg(`บันทึก ${task} แล้ว (${result})`);
  };

  const download = () => {
    const head = "participant,task,result,seconds,searches,scroll_events,clicks,page_changes,timestamp,system";
    const csv = [head, ...results.map((r) => [...r, "LSF"].join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    a.download = "LSF_results.csv";
    a.click();
  };

  const clearAll = () => {
    if (!confirm("ลบผลที่บันทึกไว้ในเครื่องนี้ทั้งหมด?")) return;
    setResults([]);
    try { localStorage.removeItem(LS.res); localStorage.removeItem(LS.run); } catch {}
  };

  if (!enabled) return null;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const prompt = TASKS.find((t) => t[0] === task)?.[1];
  const btn = "rounded border px-2 py-1 text-xs hover:bg-muted disabled:opacity-40";

  return (
    <div data-study-timer className="fixed bottom-3 right-3 z-[9999] w-72 rounded-lg border bg-background text-foreground shadow-lg text-sm">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full text-left px-3 py-2 font-semibold border-b flex justify-between">
        <span>โหมดทดสอบ (LSF)</span><span>{running ? `${mm}:${ss}` : open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="p-3 space-y-2">
          <input className="w-full rounded border px-2 py-1 text-xs bg-background" placeholder="รหัสผู้ทดสอบ" value={pid} onChange={(e) => setPid(e.target.value)} disabled={running} />
          <select className="w-full rounded border px-2 py-1 text-xs bg-background" value={task} onChange={(e) => setTask(e.target.value)} disabled={running}>
            {TASKS.map((t) => <option key={t[0]} value={t[0]}>{t[0]}</option>)}
          </select>
          {running && <p className="text-xs rounded bg-muted p-2">โจทย์: {prompt}</p>}
          <div className="flex gap-1 flex-wrap">
            <button type="button" className={btn} onClick={start} disabled={running}>เริ่ม</button>
            <button type="button" className={btn} onClick={() => finish("found")} disabled={!running}>พบแล้ว</button>
            <button type="button" className={btn} onClick={() => finish("gaveup")} disabled={!running}>ยอมแพ้</button>
          </div>
          {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
          <div className="flex gap-1 items-center text-xs text-muted-foreground">
            <span>บันทึกแล้ว {results.length} งาน</span>
            <button type="button" className={btn} onClick={download} disabled={!results.length}>ดาวน์โหลด CSV</button>
            <button type="button" className={btn} onClick={clearAll} disabled={!results.length}>ล้าง</button>
          </div>
        </div>
      )}
    </div>
  );
}
