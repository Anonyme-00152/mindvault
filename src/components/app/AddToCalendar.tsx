"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarPlus, ChevronDown } from "lucide-react";
import { googleCalendarUrl, icsQuery, noteToEvent, DEFAULT_DURATION_MIN } from "@/lib/ics";
import { getLeadMin, isIOS } from "@/lib/pwa";
import { effectiveLead } from "@/lib/reminders";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

export function calendarLinks(note: Note, opts: { duration?: number; alarmMinutes?: number } = {}) {
  // The .ics alarm mirrors the note's reminder; a note on the global default gets the global lead.
  const lead = note.time ? effectiveLead(note, getLeadMin()) : null;
  const alarm = opts.alarmMinutes ?? (note.time && note.remindMin === undefined && lead !== null ? lead : undefined);
  const ev = noteToEvent(note, { duration: opts.duration ?? DEFAULT_DURATION_MIN, alarmMinutes: alarm, url: typeof window !== "undefined" ? `${location.origin}/app/notes?open=${note.id}` : undefined });
  if (!ev) return null;
  return { ics: `/api/ics?${icsQuery(ev)}`, google: googleCalendarUrl(ev) };
}

/** Opens the .ics (iPhone / Apple Calendar / Outlook) — or a menu with Google too. */
export function AddToCalendar({ note, className, compact = false, alarmMinutes }: { note: Note; className?: string; compact?: boolean; alarmMinutes?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const links = calendarLinks(note, { alarmMinutes });

  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", off);
    return () => window.removeEventListener("mousedown", off);
  }, [open]);

  if (!links) return null;
  const primaryLabel = isIOS() ? "Add to iPhone Calendar" : "Add to Calendar";

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <a href={links.ics} className={cn("btn btn-ghost", compact ? "btn-sm" : "", "!rounded-r-none")} title="Downloads a .ics — opens in Apple Calendar / Outlook">
        <CalendarPlus size={compact ? 13 : 15} /> {primaryLabel}
      </a>
      <button type="button" onClick={() => setOpen((o) => !o)} className={cn("btn btn-ghost !rounded-l-none !border-l-0 !px-2.5", compact ? "btn-sm" : "")} aria-label="More calendar options" aria-expanded={open}>
        <ChevronDown size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.18 }} className="absolute right-0 top-full mt-2 z-20 min-w-[220px] rounded-xl border border-line bg-bg-elev p-1.5 shadow-[var(--shadow-pop)]">
            <a href={links.ics} className="block px-3 py-2 rounded-lg text-[13px] hover:bg-glass-hover" onClick={() => setOpen(false)}>
              Apple Calendar / Outlook (.ics)
            </a>
            <a href={links.google} target="_blank" rel="noreferrer" className="block px-3 py-2 rounded-lg text-[13px] hover:bg-glass-hover" onClick={() => setOpen(false)}>
              Google Calendar
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
