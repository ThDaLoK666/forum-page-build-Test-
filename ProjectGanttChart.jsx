"use client";

import { useMemo } from "react";

// ---------------------------------------------------------------------------
// Data — sourced from the ICT Community Forum Proposal (real dates) and the
// System Decomposition Diagram (done / not-done feature status).
// Dates marked `estimated: true` are not stated exactly in the source docs.
// ---------------------------------------------------------------------------

const START = new Date("2026-05-10");
const END = new Date("2026-12-18");
const TODAY = new Date("2026-09-18");

const ROWS = [
  { type: "header", label: "การวิจัยและออกแบบ" },
  {
    type: "task",
    label: "เก็บความต้องการ (Survey + คู่แข่ง)",
    start: "2026-05-10",
    end: "2026-06-05",
    progress: 100,
  },
  {
    type: "task",
    label: "ออกแบบ UI/UX (Wireframe + v0)",
    start: "2026-06-06",
    end: "2026-07-15",
    progress: 100,
    estimated: true,
  },
  { type: "header", label: "พัฒนาระบบ" },
  {
    type: "task",
    label: "พัฒนาต้นแบบทั้งระบบ (S1–S4)",
    start: "2026-06-15",
    end: "2026-08-07",
    progress: 100,
    estimated: true,
    detail: "ครอบคลุมทุกฟีเจอร์สีเขียวใน Decomposition Diagram · commit 1dd2602",
  },
  { type: "header", label: "ทดสอบและปรับปรุง" },
  { type: "milestone", label: "P0 Pilot Test", date: "2026-08-01" },
  { type: "milestone", label: "P1 Usability Test", date: "2026-08-22" },
  {
    type: "task",
    label: "แก้ไข UX ตามผลทดสอบ",
    start: "2026-08-23",
    end: "2026-08-28",
    progress: 100,
  },
  { type: "milestone", label: "P2/P3 Pilot Test เสริม", date: "2026-09-02" },
  { type: "header", label: "สรุปผลและนำเสนอ" },
  {
    type: "task",
    label: "เขียน Proposal + ตรวจสไลด์/Diagram",
    start: "2026-09-01",
    end: "2026-09-18",
    progress: 75,
  },
  { type: "header", label: "ITDS492 (แผนอนาคต – ยังไม่เริ่ม)" },
  {
    type: "task",
    label: "เชื่อม Supabase (Auth, RLS)",
    start: "2026-09-19",
    end: "2026-11-20",
    progress: 0,
    estimated: true,
    detail: "S1.1.2 Real Auth และฟีเจอร์สีเทาที่ต้องมีฐานข้อมูลจริง",
  },
  {
    type: "task",
    label: "Profile CRUD + Admin Dashboard",
    start: "2026-09-19",
    end: "2026-11-06",
    progress: 0,
    estimated: true,
    detail: "S1.2 Update/Delete Profile · S4.3 Admin Dashboard",
  },
  {
    type: "task",
    label: "ระบบกำกับดูแล (Misconduct, Report)",
    start: "2026-10-15",
    end: "2026-12-18",
    progress: 0,
    estimated: true,
    detail: "S4.4.1 Misconduct Scan · S4.4.2 Guideline Docs · S4.4.3 Report Content",
  },
];

const PX_PER_DAY = 60 / 7;
const INFO_WIDTH = 330;
const MONTH_ABBR = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function daysFromStart(dateStr) {
  return (new Date(dateStr) - START) / 86400000;
}
function leftPx(dateStr) {
  return daysFromStart(dateStr) * PX_PER_DAY;
}
function formatShort(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTH_ABBR[d.getMonth()]}`;
}
function isoDay(d) {
  return d.toISOString().slice(0, 10);
}
function getWeeks() {
  const weeks = [];
  for (let d = new Date(START); d <= END; d.setDate(d.getDate() + 7)) {
    weeks.push(new Date(d));
  }
  return weeks;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectGanttChart() {
  const weeks = useMemo(getWeeks, []);
  const timelineWidth = leftPx(isoDay(END)) + 40;
  const todayLeft = leftPx(isoDay(TODAY));

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.srOnly}>
        Gantt chart รายละเอียดโครงการ ICT Community Forum ตั้งแต่พฤษภาคมถึงธันวาคม 2569
        แบ่งตามเฟส งานย่อย และความคืบหน้า
      </h2>

      <div style={styles.legend}>
        <LegendItem color="#1D9E75" label="เสร็จแล้ว" />
        <LegendItem color="#BA7517" label="กำลังทำ" />
        <LegendItem color="#E1DFD6" border="#B4B2A9" label="ยังไม่เริ่ม" />
        <LegendItem diamond label="วันทดสอบ (milestone)" />
      </div>

      <div style={styles.scrollArea}>
        <div style={{ width: INFO_WIDTH + timelineWidth }}>
          {/* header row: column labels + week ruler */}
          <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 3, background: "#fff" }}>
            <div style={{ ...styles.infoHeaderCell, width: INFO_WIDTH }}>
              งาน / ความคืบหน้า / เริ่ม / สิ้นสุด
            </div>
            <div
              style={{
                position: "relative",
                width: timelineWidth,
                height: 22,
                borderBottom: "1px solid #e5e5e0",
              }}
            >
              {weeks.map((w, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: leftPx(isoDay(w)) + 2,
                    fontSize: 10,
                    color: "#8a8a85",
                    borderLeft: "1px solid #e5e5e0",
                    paddingLeft: 3,
                    height: 22,
                  }}
                >
                  {formatShort(isoDay(w))}
                </div>
              ))}
            </div>
          </div>

          {ROWS.map((row, i) => (
            <Row key={i} row={row} timelineWidth={timelineWidth} todayLeft={todayLeft} />
          ))}
        </div>
      </div>

      <p style={styles.footnote}>
        * ช่วงออกแบบ/เริ่มพัฒนา และแผน ITDS492 เป็นการประมาณ (ไม่มีวันที่แน่นอนในเอกสารต้นฉบับ)
        ส่วนวันทดสอบและวัน commit เป็นวันที่จริงจาก Proposal &middot; เส้นประ = วันนี้ (18 ก.ย. 2569)
      </p>
    </div>
  );
}

function Row({ row, timelineWidth, todayLeft }) {
  const height = row.type === "header" ? 26 : 30;

  return (
    <div style={{ display: "flex" }}>
      <InfoCell row={row} />
      <div
        style={{
          position: "relative",
          width: timelineWidth,
          height,
          borderBottom: row.type === "header" ? "none" : "1px solid #f0f0ec",
          background: row.type === "header" ? "#fafaf8" : "transparent",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: todayLeft,
            top: 0,
            bottom: 0,
            width: 0,
            borderLeft: "1.5px dashed #b7b7b0",
          }}
        />
        {row.type === "milestone" && <Milestone row={row} height={height} />}
        {row.type === "task" && <TaskBar row={row} height={height} />}
      </div>
    </div>
  );
}

function InfoCell({ row }) {
  if (row.type === "header") {
    return (
      <div style={{ ...styles.infoCellBase, width: INFO_WIDTH, background: "#fafaf8", fontWeight: 500 }}>
        {row.label}
      </div>
    );
  }
  return (
    <div style={{ ...styles.infoCellBase, width: INFO_WIDTH, gap: 6, borderBottom: "1px solid #f0f0ec" }}>
      <span style={styles.infoLabel} title={row.detail || row.label}>
        {row.label}
      </span>
      {row.type === "task" && <span style={styles.infoMeta}>{row.progress}%</span>}
      <span style={styles.infoMeta}>{formatShort(row.type === "milestone" ? row.date : row.start)}</span>
      {row.type === "task" && <span style={styles.infoMeta}>{formatShort(row.end)}</span>}
    </div>
  );
}

function TaskBar({ row, height }) {
  const left = leftPx(row.start);
  const width = Math.max(4, leftPx(row.end) - left);
  const fillColor = row.progress === 0 ? "transparent" : row.progress < 100 ? "#BA7517" : "#1D9E75";
  return (
    <div
      title={row.detail || row.label}
      style={{
        position: "absolute",
        left,
        top: height / 2 - 7,
        width,
        height: 14,
        background: "#E1DFD6",
        border: "1px solid #B4B2A9",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <div style={{ width: `${row.progress}%`, height: "100%", background: fillColor }} />
    </div>
  );
}

function Milestone({ row, height }) {
  const x = leftPx(row.date);
  return (
    <div
      title={`${row.label}: ${row.date}`}
      style={{
        position: "absolute",
        left: x - 6,
        top: height / 2 - 6,
        width: 12,
        height: 12,
        background: "#1D9E75",
        transform: "rotate(45deg)",
        borderRadius: 2,
      }}
    />
  );
}

function LegendItem({ color, border, label, diamond }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555550" }}>
      <span
        style={{
          width: diamond ? 8 : 10,
          height: diamond ? 8 : 10,
          borderRadius: diamond ? 0 : 2,
          background: diamond ? "#1D9E75" : color,
          border: border ? `1px solid ${border}` : "none",
          transform: diamond ? "rotate(45deg)" : "none",
        }}
      />
      {label}
    </span>
  );
}

const styles = {
  wrapper: { fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 760 },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: 0,
  },
  legend: { display: "flex", gap: 16, flexWrap: "wrap", margin: "0 0 12px" },
  scrollArea: { overflowX: "auto", border: "1px solid #e5e5e0", borderRadius: 8 },
  infoHeaderCell: {
    flexShrink: 0,
    position: "sticky",
    left: 0,
    zIndex: 4,
    background: "#fff",
    borderBottom: "1px solid #e5e5e0",
    display: "flex",
    alignItems: "center",
    padding: "0 8px",
    fontSize: 11,
    color: "#8a8a85",
  },
  infoCellBase: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    position: "sticky",
    left: 0,
    zIndex: 2,
    padding: "0 8px 0 16px",
    fontSize: 11,
    background: "#fff",
  },
  infoLabel: {
    flex: 1,
    color: "#1a1a19",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  infoMeta: { width: 40, textAlign: "right", color: "#8a8a85", flexShrink: 0 },
  footnote: { fontSize: 11, color: "#8a8a85", margin: "10px 0 0" },
};
