import { addDays, format } from "date-fns";
import type { Note } from "./types";
import { toISODate } from "./utils";

const RANK = { urgent: 0, high: 1, medium: 2, low: 3 } as const;

export interface Brief {
  /** Sentences with **bold** spans, read top to bottom. */
  lines: string[];
  /** The note worth opening first, if any. */
  next: Note | null;
}

const open = (n: Note) => n.checklist.filter((c) => !c.done).length;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/**
 * The dashboard's daily brief. Deterministic and computed on the device from the
 * notes alone — no network, so it is instant and private.
 */
export function dailyBrief(notes: Note[], now = new Date()): Brief {
  const today = toISODate(now);
  const hhmm = format(now, "HH:mm");
  const todays = notes.filter((n) => n.date === today).sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
  const lines: string[] = [];

  if (notes.length === 0) {
    return {
      lines: ["Your vault is empty and private to this device.", "Create a first note — give it a date and it will appear in this brief."],
      next: null,
    };
  }

  // 1 — the shape of the day
  if (todays.length === 0) lines.push("Nothing is scheduled today — a clear day to get ahead.");
  else {
    const items = todays.slice(0, 3).map((n) => `**${n.title}**${n.time ? ` at ${n.time}` : ""}`);
    const more = todays.length > 3 ? ` and ${todays.length - 3} more` : "";
    lines.push(`${todays.length === 1 ? "One thing" : `${todays.length} things`} on your plate today: ${list(items)}${more}.`);
  }

  // 2 — what comes next right now
  const upcomingToday = todays.find((n) => n.time && n.time >= hhmm);
  let next: Note | null = upcomingToday ?? null;
  if (upcomingToday) {
    const left = open(upcomingToday);
    lines.push(`Up next is **${upcomingToday.title}** at ${upcomingToday.time}${left ? ` — ${left} task${left > 1 ? "s" : ""} still open` : ", and you're fully prepared"}.`);
  }

  // 3 — the most pressing thing this week
  const horizon = toISODate(addDays(now, 7));
  const pressing = notes
    .filter((n) => n.id !== upcomingToday?.id && open(n) > 0 && (!n.date || n.date <= horizon) && (n.priority === "urgent" || n.priority === "high"))
    .sort((a, b) => RANK[a.priority] - RANK[b.priority] || (a.date ?? "9").localeCompare(b.date ?? "9"))[0];
  if (pressing) {
    const when = pressing.date ? (pressing.date === today ? "today" : `on ${format(new Date(pressing.date + "T00:00:00"), "EEEE")}`) : "";
    lines.push(`Keep an eye on **${pressing.title}**${when ? ` ${when}` : ""} — it's ${pressing.priority} priority with ${open(pressing)} task${open(pressing) > 1 ? "s" : ""} left.`);
    next ??= pressing;
  }

  // 4 — momentum
  const tasks = notes.flatMap((n) => n.checklist);
  const done = tasks.filter((t) => t.done).length;
  if (tasks.length) {
    const pct = Math.round((done / tasks.length) * 100);
    lines.push(
      pct === 100
        ? "Every task in your vault is done. Remarkable."
        : `You've closed **${done} of ${tasks.length}** tasks (${pct}%)${pct >= 50 ? " — good momentum." : ". One small win now changes the day."}`,
    );
  }

  next ??= todays[0] ?? null;
  return { lines, next };
}
