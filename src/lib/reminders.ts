/**
 * Reminder maths — pure and shared by the client scheduler and the server tick.
 */
import { REMIND_DAY_HOUR, type Note } from "./types";

export interface Reminder {
  /** stable per note: `${noteId}` */
  id: string;
  title: string;
  body: string;
  /** epoch ms when the notification should fire */
  at: number;
  /** path to open on tap */
  url: string;
}

export const DEFAULT_LEAD_MIN = 10;

/** Local wall-clock "YYYY-MM-DD" + "HH:MM" → epoch ms in the *current* timezone. */
export function localDateTimeToEpoch(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0).getTime();
}

/** Effective lead for a timed note: per-note value, legacy flag, or the global default. null = off. */
export function effectiveLead(note: Note, defaultLead: number): number | null {
  if (note.remind === false && note.remindMin === undefined) return null;
  if (note.remindMin === null) return null;
  if (typeof note.remindMin === "number") return note.remindMin;
  return defaultLead;
}

export function leadLabel(min: number) {
  if (min === 0) return "at the time";
  if (min < 60) return `${min} min before`;
  if (min < 1440) return `${min / 60} h before`;
  return min === 1440 ? "1 day before" : `${min / 1440} days before`;
}

/**
 * Reminders for every note that opted in:
 *  - timed notes: `lead` minutes before the start time
 *  - all-day notes with `remindDay`: that day (or the day before) at REMIND_DAY_HOUR
 * Past reminders are dropped.
 */
export function remindersFor(notes: Note[], defaultLead = DEFAULT_LEAD_MIN, now = Date.now()): Reminder[] {
  const out: Reminder[] = [];
  const hh = String(REMIND_DAY_HOUR).padStart(2, "0") + ":00";
  for (const n of notes) {
    if (!n.date) continue;
    let at: number | null = null;
    let body = "";
    if (n.time) {
      const lead = effectiveLead(n, defaultLead);
      if (lead === null) continue;
      at = localDateTimeToEpoch(n.date, n.time) - lead * 60_000;
      body = lead > 0 ? `${leadLabel(lead)} · ${n.time}${n.endTime ? `–${n.endTime}` : ""}` : `Now · ${n.time}${n.endTime ? `–${n.endTime}` : ""}`;
    } else if (n.remindDay === "same" || n.remindDay === "before") {
      const date = n.remindDay === "same" ? n.date : shiftDate(n.date, -1);
      at = localDateTimeToEpoch(date, hh);
      body = n.remindDay === "same" ? "Today" : "Tomorrow";
    } else continue;
    if (at < now - 60_000) continue;
    out.push({ id: n.id, title: n.title || "Untitled", body, at, url: `/app/notes?open=${encodeURIComponent(n.id)}` });
  }
  return out.sort((a, b) => a.at - b.at);
}

export function shiftDate(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/** Reminders due in [now - grace, now]. */
export function dueReminders(reminders: Reminder[], now = Date.now(), graceMs = 5 * 60_000) {
  return reminders.filter((r) => r.at <= now && r.at >= now - graceMs);
}
