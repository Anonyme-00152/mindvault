import { describe, expect, it } from "vitest";
import { dueReminders, localDateTimeToEpoch, remindersFor } from "../reminders";
import type { Note } from "../types";

function note(p: Partial<Note>): Note {
  return { id: "n", title: "T", content: "", checklist: [], priority: "low", category: "other", tags: [], pinned: false, createdAt: "", updatedAt: "", ...p };
}

describe("remindersFor", () => {
  const now = localDateTimeToEpoch("2026-09-16", "09:00");

  it("creates one reminder per timed note, lead minutes before", () => {
    const r = remindersFor([note({ id: "a", title: "Run", date: "2026-09-16", time: "10:00" })], 10, now);
    expect(r).toHaveLength(1);
    expect(r[0].at).toBe(localDateTimeToEpoch("2026-09-16", "09:50"));
    expect(r[0].url).toBe("/app/notes?open=a");
    expect(r[0].body).toContain("10 min");
  });
  it("skips notes without a time, opted-out notes and past notes", () => {
    const r = remindersFor(
      [
        note({ id: "nodate" }),
        note({ id: "noTime", date: "2026-09-16" }),
        note({ id: "off", date: "2026-09-16", time: "12:00", remind: false }),
        note({ id: "past", date: "2026-09-15", time: "12:00" }),
        note({ id: "ok", date: "2026-09-16", time: "12:00" }),
      ],
      10,
      now,
    );
    expect(r.map((x) => x.id)).toEqual(["ok"]);
  });
  it("honours per-note reminders: minutes before, off, all-day same/before", () => {
    const r = remindersFor(
      [
        note({ id: "five", date: "2026-09-16", time: "12:00", remindMin: 5 }),
        note({ id: "off", date: "2026-09-16", time: "12:00", remindMin: null }),
        note({ id: "same", date: "2026-09-17", remindDay: "same" }),
        note({ id: "before", date: "2026-09-18", remindDay: "before" }),
        note({ id: "nothing", date: "2026-09-18" }),
      ],
      10,
      now,
    );
    expect(r.map((x) => x.id)).toEqual(["five", "same", "before"]);
    expect(r[0].at).toBe(localDateTimeToEpoch("2026-09-16", "11:55"));
    expect(r[1].at).toBe(localDateTimeToEpoch("2026-09-17", "09:00"));
    expect(r[2].at).toBe(localDateTimeToEpoch("2026-09-17", "09:00"));
  });
  it("sorts by time", () => {
    const r = remindersFor([note({ id: "b", date: "2026-09-16", time: "15:00" }), note({ id: "a", date: "2026-09-16", time: "11:00" })], 0, now);
    expect(r.map((x) => x.id)).toEqual(["a", "b"]);
  });
});

describe("dueReminders", () => {
  it("returns reminders inside the grace window only", () => {
    const now = 1_000_000;
    const list = [
      { id: "early", title: "", body: "", at: now - 10 * 60_000, url: "/" },
      { id: "due", title: "", body: "", at: now - 60_000, url: "/" },
      { id: "future", title: "", body: "", at: now + 60_000, url: "/" },
    ];
    expect(dueReminders(list, now, 5 * 60_000).map((r) => r.id)).toEqual(["due"]);
  });
});
