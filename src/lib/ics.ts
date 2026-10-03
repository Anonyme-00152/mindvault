/**
 * Calendar interop — pure functions, no DOM.
 * `.ics` files open natively on iPhone (Safari → "Add to Calendar"), macOS, Outlook.
 */
import type { Note } from "./types";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  /** local wall-clock start, e.g. "2026-09-16T14:00" */
  start: string;
  /** minutes */
  duration: number;
  /** minutes before start for the alarm; omit for none */
  alarmMinutes?: number;
  url?: string;
}

export const DEFAULT_DURATION_MIN = 60;

/** Minutes between two HH:MM on the same day (end before start → +24h). */
export function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let d = eh * 60 + em - (sh * 60 + sm);
  if (d <= 0) d += 24 * 60;
  return d;
}

/**
 * A note becomes an event when it has a date; without a time it is an all-day
 * event. Duration comes from endTime when set. The alarm mirrors the note's own
 * reminder (remindMin / remindDay) unless overridden.
 */
export function noteToEvent(note: Note, opts: { duration?: number; alarmMinutes?: number; url?: string } = {}): CalendarEvent | null {
  if (!note.date) return null;
  const allDay = !note.time;
  let alarm = opts.alarmMinutes;
  if (alarm === undefined) {
    if (!allDay && typeof note.remindMin === "number") alarm = note.remindMin;
    if (allDay && note.remindDay === "same") alarm = -(9 * 60); // 09:00 that day
    if (allDay && note.remindDay === "before") alarm = 15 * 60; // 09:00 the day before
  }
  return {
    id: note.id,
    title: note.title || "Untitled",
    description: [note.content, ...note.checklist.map((c) => `${c.done ? "☑" : "☐"} ${c.text}`)].filter(Boolean).join("\n"),
    start: allDay ? note.date : `${note.date}T${note.time}`,
    duration: allDay ? 24 * 60 : note.time && note.endTime ? minutesBetween(note.time, note.endTime) : (opts.duration ?? DEFAULT_DURATION_MIN),
    alarmMinutes: alarm,
    url: opts.url,
  };
}

export function isAllDay(ev: CalendarEvent) {
  return !ev.start.includes("T");
}

/** Escape per RFC 5545 §3.3.11 */
export function icsEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fold lines at 75 octets (RFC 5545 §3.1). */
export function foldLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length;
    if (bytes + b > 75) {
      out.push(cur);
      cur = " " + ch;
      bytes = 1 + b;
    } else {
      cur += ch;
      bytes += b;
    }
  }
  out.push(cur);
  return out.join("\r\n");
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** "2026-09-16T14:00" → "20260916T140000" (floating local time) */
export function toIcsLocal(start: string) {
  const [d, t = "00:00"] = start.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [h, min] = t.split(":").map(Number);
  return `${y}${pad(m)}${pad(day)}T${pad(h)}${pad(min)}00`;
}

export function toIcsDate(date: string) {
  return date.replace(/-/g, "");
}

export function addMinutes(start: string, minutes: number) {
  const [d, t = "00:00"] = start.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [h, min] = t.split(":").map(Number);
  const dt = new Date(y, m - 1, day, h, min + minutes);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export function buildIcs(events: CalendarEvent[], opts: { prodId?: string; now?: Date } = {}) {
  const now = opts.now ?? new Date();
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:${opts.prodId ?? "-//MindVault//EN"}`, "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const ev of events) {
    lines.push("BEGIN:VEVENT", `UID:${ev.id}@mindvault`, `DTSTAMP:${stamp}`);
    if (isAllDay(ev)) {
      lines.push(`DTSTART;VALUE=DATE:${toIcsDate(ev.start)}`, `DTEND;VALUE=DATE:${toIcsDate(addDays(ev.start, Math.max(1, Math.round(ev.duration / (24 * 60)))))}`);
    } else {
      lines.push(`DTSTART:${toIcsLocal(ev.start)}`, `DTEND:${toIcsLocal(addMinutes(ev.start, ev.duration))}`);
    }
    lines.push(`SUMMARY:${icsEscape(ev.title)}`);
    if (ev.description) lines.push(`DESCRIPTION:${icsEscape(ev.description)}`);
    if (ev.url) lines.push(`URL:${ev.url}`);
    if (ev.alarmMinutes != null) {
      const m = Math.abs(ev.alarmMinutes);
      const trig = ev.alarmMinutes >= 0 ? `-PT${m}M` : `PT${m}M`;
      lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(ev.title)}`, `TRIGGER:${trig}`, "END:VALARM");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Google Calendar "add event" deep link (works on Android and desktop). */
export function googleCalendarUrl(ev: CalendarEvent) {
  const dates = isAllDay(ev)
    ? `${toIcsDate(ev.start)}/${toIcsDate(addDays(ev.start, 1))}`
    : `${toIcsLocal(ev.start)}/${toIcsLocal(addMinutes(ev.start, ev.duration))}`;
  const p = new URLSearchParams({ action: "TEMPLATE", text: ev.title, dates });
  if (ev.description) p.set("details", ev.description);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

/** Query string for /api/ics so the server can stream a .ics (iOS needs a real URL, not a blob). */
export function icsQuery(ev: CalendarEvent) {
  const p = new URLSearchParams({ id: ev.id, title: ev.title, start: ev.start, duration: String(ev.duration) });
  if (ev.description) p.set("description", ev.description.slice(0, 1500));
  if (ev.alarmMinutes != null) p.set("alarm", String(ev.alarmMinutes));
  if (ev.url) p.set("url", ev.url);
  return p.toString();
}

export function eventFromQuery(q: URLSearchParams): CalendarEvent | null {
  const title = q.get("title");
  const start = q.get("start");
  if (!title || !start || !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(start)) return null;
  const duration = Number(q.get("duration") ?? DEFAULT_DURATION_MIN);
  const alarm = q.get("alarm");
  return {
    id: (q.get("id") ?? "event").replace(/[^\w-]/g, "").slice(0, 64) || "event",
    title: title.slice(0, 200),
    description: q.get("description")?.slice(0, 1500) || undefined,
    start,
    duration: Number.isFinite(duration) && duration > 0 && duration <= 7 * 24 * 60 ? duration : DEFAULT_DURATION_MIN,
    alarmMinutes: alarm != null && Number.isFinite(Number(alarm)) ? Math.max(-1440, Math.min(10080, Number(alarm))) : undefined,
    url: q.get("url")?.slice(0, 500) || undefined,
  };
}
