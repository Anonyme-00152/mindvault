import { describe, expect, it } from "vitest";
import { addDays, addMinutes, buildIcs, eventFromQuery, foldLine, googleCalendarUrl, icsEscape, icsQuery, noteToEvent, toIcsLocal } from "../ics";
import type { Note } from "../types";

const base: Note = {
  id: "n_abc",
  title: "Call with Léa",
  content: "Bring the timeline; be honest, less polished.",
  checklist: [{ id: "c1", text: "Print summary", done: false }],
  date: "2026-09-17",
  time: "11:30",
  priority: "urgent",
  category: "work",
  tags: ["meeting"],
  pinned: false,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

describe("ics primitives", () => {
  it("escapes RFC 5545 specials", () => {
    expect(icsEscape("a;b,c\\d\ne")).toBe("a\\;b\\,c\\\\d\\ne");
  });
  it("folds long lines at 75 octets with a leading space", () => {
    const folded = foldLine("X".repeat(160));
    const parts = folded.split("\r\n");
    expect(parts[0].length).toBe(75);
    expect(parts[1].startsWith(" ")).toBe(true);
    expect(parts.join("").replace(/ /g, "")).toBe("X".repeat(160));
  });
  it("formats local times and arithmetic", () => {
    expect(toIcsLocal("2026-09-17T11:30")).toBe("20260917T113000");
    expect(addMinutes("2026-09-17T23:30", 60)).toBe("2026-09-18T00:30");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("noteToEvent", () => {
  it("returns null without a date", () => {
    expect(noteToEvent({ ...base, date: undefined })).toBeNull();
  });
  it("makes a timed event with alarm and checklist in the description", () => {
    const ev = noteToEvent(base, { alarmMinutes: 10 })!;
    expect(ev.start).toBe("2026-09-17T11:30");
    expect(ev.duration).toBe(60);
    expect(ev.alarmMinutes).toBe(10);
    expect(ev.description).toContain("☐ Print summary");
  });
  it("makes an all-day event without a time; alarm follows remindDay", () => {
    const ev = noteToEvent({ ...base, time: undefined })!;
    expect(ev.start).toBe("2026-09-17");
    expect(ev.alarmMinutes).toBeUndefined();
    expect(noteToEvent({ ...base, time: undefined, remindDay: "same" })!.alarmMinutes).toBe(-540); // 09:00 that day
    expect(noteToEvent({ ...base, time: undefined, remindDay: "before" })!.alarmMinutes).toBe(900); // 09:00 the day before
  });
  it("uses the end time for the duration and the per-note reminder for the alarm", () => {
    const ev = noteToEvent({ ...base, endTime: "13:15", remindMin: 5 })!;
    expect(ev.duration).toBe(105);
    expect(ev.alarmMinutes).toBe(5);
    expect(noteToEvent({ ...base, time: "23:30", endTime: "00:30" })!.duration).toBe(60); // crosses midnight
    expect(noteToEvent({ ...base, remindMin: null })!.alarmMinutes).toBeUndefined();
  });
});

describe("buildIcs", () => {
  it("produces a valid VCALENDAR with VEVENT + VALARM", () => {
    const ics = buildIcs([noteToEvent(base, { alarmMinutes: 15 })!], { now: new Date("2026-09-16T10:00:00Z") });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20260917T113000");
    expect(ics).toContain("DTEND:20260917T123000");
    expect(ics).toContain("SUMMARY:Call with Léa");
    expect(ics).toContain("TRIGGER:-PT15M");
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain("DESCRIPTION:Bring the timeline\\; be honest\\, less polished.\\n☐ Print summary");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    // every line ≤ 75 octets
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
  it("uses VALUE=DATE for all-day events", () => {
    const ics = buildIcs([noteToEvent({ ...base, time: undefined })!]);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260917");
    expect(ics).toContain("DTEND;VALUE=DATE:20260918");
    expect(ics).not.toContain("VALARM");
    const withAlarm = buildIcs([noteToEvent({ ...base, time: undefined, remindDay: "same" })!]);
    expect(withAlarm).toContain("TRIGGER:PT540M");
  });
});

describe("query round-trip and links", () => {
  it("survives icsQuery → eventFromQuery", () => {
    const ev = noteToEvent(base, { alarmMinutes: 10, url: "https://x.test/app/notes?open=n_abc" })!;
    const back = eventFromQuery(new URLSearchParams(icsQuery(ev)))!;
    expect(back.title).toBe(ev.title);
    expect(back.start).toBe(ev.start);
    expect(back.duration).toBe(60);
    expect(back.alarmMinutes).toBe(10);
    expect(back.url).toBe(ev.url);
  });
  it("rejects malformed input and clamps values", () => {
    expect(eventFromQuery(new URLSearchParams("title=x&start=nope"))).toBeNull();
    const ev = eventFromQuery(new URLSearchParams("title=x&start=2026-01-01T10:00&duration=999999&alarm=-5&id=../evil"))!;
    expect(ev.duration).toBe(60);
    expect(ev.alarmMinutes).toBe(-5); // negative = after start (all-day 09:00 alarms)
    expect(ev.id).toBe("evil");
  });
  it("builds a Google Calendar template link", () => {
    const url = googleCalendarUrl(noteToEvent(base)!);
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("dates=20260917T113000%2F20260917T123000");
  });
});
