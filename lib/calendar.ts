/**
 * Calendar helpers for Study Sessions.
 * Generates .ics files (download) and Google Calendar links (open in browser).
 */

export interface SessionEvent {
  title: string;
  description?: string;
  location?: string;
  /** "2026-08-08" */
  date?: string;
  /** "14:00 - 17:00" or "14:00" */
  time?: string;
  url?: string;
}

/** Parse "14:00 - 17:00" into start/end Date objects on the given date. */
export function parseSessionDateTime(date?: string, time?: string) {
  if (!date) return null;

  const [rawStart, rawEnd] = (time || "09:00").split(/\s*[-–]\s*/);
  const startClock = (rawStart || "09:00").trim();
  const endClock = (rawEnd || "").trim();

  const start = new Date(`${date}T${normalizeClock(startClock)}:00`);
  if (isNaN(start.getTime())) return null;

  let end: Date;
  if (endClock) {
    end = new Date(`${date}T${normalizeClock(endClock)}:00`);
    if (isNaN(end.getTime()) || end <= start) {
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    }
  } else {
    end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  }

  return { start, end };
}

function normalizeClock(clock: string) {
  const match = clock.match(/(\d{1,2})[:.]?(\d{2})?/);
  if (!match) return "09:00";
  const hh = String(Math.min(23, parseInt(match[1], 10))).padStart(2, "0");
  const mm = String(Math.min(59, parseInt(match[2] || "0", 10))).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Format a Date as an ICS/Google UTC timestamp: 20260808T070000Z */
function toUtcStamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildIcs(event: SessionEvent): string | null {
  const range = parseSessionDateTime(event.date, event.time);
  if (!range) return null;

  const uid = `session-${range.start.getTime()}@ict-forum.mahidol`;
  const descriptionParts = [event.description || "", event.url ? `Meeting: ${event.url}` : ""]
    .filter(Boolean)
    .join("\n\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ICT Forum Mahidol//Study Session//TH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(range.start)}`,
    `DTEND:${toUtcStamp(range.end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    descriptionParts ? `DESCRIPTION:${escapeIcs(descriptionParts)}` : "",
    event.location ? `LOCATION:${escapeIcs(event.location)}` : "",
    event.url ? `URL:${escapeIcs(event.url)}` : "",
    // Reminder 1 day before + 1 hour before
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:พรุ่งนี้มีนัดติว",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:อีก 1 ชั่วโมงจะถึงเวลาติว",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

/** Trigger a real .ics file download in the browser. */
export function downloadIcs(event: SessionEvent): boolean {
  const ics = buildIcs(event);
  if (!ics) return false;

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilename(event.title)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export function googleCalendarUrl(event: SessionEvent): string | null {
  const range = parseSessionDateTime(event.date, event.time);
  if (!range) return null;

  const details = [event.description || "", event.url ? `Meeting: ${event.url}` : ""]
    .filter(Boolean)
    .join("\n\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toUtcStamp(range.start)}/${toUtcStamp(range.end)}`,
    details,
    location: event.location || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function sanitizeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").slice(0, 80).trim() || "study-session";
}

/** Human readable countdown to a session. */
export function sessionCountdown(date?: string, time?: string) {
  const range = parseSessionDateTime(date, time);
  if (!range) return null;

  const diff = range.start.getTime() - Date.now();
  if (diff < 0) {
    return { text: "Started", isUrgent: true, isPast: true, diff };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return { text: `${days}d ${hours}h`, isUrgent: days <= 1, isPast: false, diff };
  if (hours > 0) return { text: `${hours}h ${mins}m`, isUrgent: hours <= 3, isPast: false, diff };
  return { text: `${mins}m`, isUrgent: true, isPast: false, diff };
}
