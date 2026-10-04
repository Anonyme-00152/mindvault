"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useFiles, useNotes } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import type { Note } from "@/lib/types";
import { toISODate } from "@/lib/utils";
import { NoteCard, PRI_COLOR } from "@/components/app/NoteCard";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";

export default function CalendarPage() {
  const notes = useNotes();
  const files = useFiles();
  const { openEditor } = useUI();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => toISODate(new Date()));
  const [dir, setDir] = useState(1);

  useEffect(() => {
    document.title = "Calendar · MindVault";
  }, []);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) }),
    [month],
  );
  const byDate = useMemo(() => {
    const m = new Map<string, Note[]>();
    (notes ?? []).forEach((n) => {
      if (!n.date) return;
      m.set(n.date, [...(m.get(n.date) ?? []), n]);
    });
    m.forEach((list) => list.sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99")));
    return m;
  }, [notes]);

  const today = toISODate(new Date());
  const agenda = byDate.get(selected) ?? [];
  const monthCount = (notes ?? []).filter((n) => n.date && isSameMonth(new Date(n.date + "T00:00:00"), month)).length;

  function go(delta: number) {
    setDir(delta);
    setMonth((m) => (delta > 0 ? addMonths(m, 1) : subMonths(m, 1)));
  }

  function newOn(date: string) {
    openEditor("new", { date });
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-7 md:py-9">
      <PageHeader
        title="Calendar"
        subtitle={`${monthCount} scheduled note${monthCount === 1 ? "" : "s"} in ${format(month, "MMMM")}. Double-click a day to plan something.`}
        actions={
          <button className="btn btn-solid btn-sm" onClick={() => newOn(selected)}>
            <Plus size={14} /> Schedule note
          </button>
        }
      />

      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
        <div className="card overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 h-14 border-b border-line">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h2
                key={month.toISOString()}
                initial={{ opacity: 0, y: dir * 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -dir * 6 }}
                transition={{ duration: 0.18 }}
                className="text-[17px] font-semibold tracking-[-0.02em]"
              >
                {format(month, "MMMM")} <span className="text-fg-faint font-medium">{format(month, "yyyy")}</span>
              </motion.h2>
            </AnimatePresence>
            <div className="ml-auto flex items-center gap-1">
              <button
                className="btn btn-sm"
                onClick={() => {
                  setDir(1);
                  setMonth(startOfMonth(new Date()));
                  setSelected(today);
                }}
              >
                Today
              </button>
              <button className="btn-icon" onClick={() => go(-1)} aria-label="Previous month">
                <ChevronLeft size={17} />
              </button>
              <button className="btn-icon" onClick={() => go(1)} aria-label="Next month">
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-line bg-bg">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="text-[11.5px] font-semibold text-fg-faint uppercase tracking-[0.04em] text-center md:text-left px-2 py-2">
                <span className="md:hidden">{d[0]}</span>
                <span className="hidden md:inline">{d}</span>
              </span>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={month.toISOString()}
              initial={{ opacity: 0, x: dir * 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir * 18 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-7 gap-px bg-line"
            >
              {days.map((d) => {
                const iso = toISODate(d);
                const items = byDate.get(iso) ?? [];
                return (
                  <button
                    key={iso}
                    className="cal-cell"
                    data-today={iso === today}
                    data-selected={iso === selected}
                    data-outside={!isSameMonth(d, month)}
                    onClick={() => setSelected(iso)}
                    onDoubleClick={() => newOn(iso)}
                    aria-label={`${format(d, "EEEE d MMMM")}${items.length ? `, ${items.length} note${items.length > 1 ? "s" : ""}` : ""}`}
                    aria-pressed={iso === selected}
                  >
                    <span className="cal-num inline-flex items-center justify-center w-6 h-6 rounded-full text-[12.5px] font-medium tabular-nums">{format(d, "d")}</span>
                    {/* Desktop: titles. Phone: dots. */}
                    <span className="hidden md:block mt-1 space-y-0.5">
                      {items.slice(0, 3).map((n) => (
                        <span
                          key={n.id}
                          className="flex items-center gap-1 h-5 px-1.5 rounded text-[11px] font-medium truncate"
                          style={{ background: `${PRI_COLOR[n.priority]}14`, color: PRI_COLOR[n.priority] }}
                        >
                          {n.time && <span className="tabular-nums opacity-80 shrink-0">{n.time}</span>}
                          <span className="truncate text-fg">{n.title}</span>
                        </span>
                      ))}
                      {items.length > 3 && <span className="block px-1.5 text-[11px] text-fg-faint">+{items.length - 3} more</span>}
                    </span>
                    {items.length > 0 && (
                      <span className="md:hidden absolute left-0 right-0 bottom-1.5 flex justify-center gap-0.5">
                        {items.slice(0, 3).map((n) => (
                          <span key={n.id} className="w-1 h-1 rounded-full" style={{ background: PRI_COLOR[n.priority] }} />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Agenda */}
        <aside className="card p-4 md:p-5 self-start xl:sticky xl:top-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[12.5px] font-medium text-brand">{selected === today ? "Today" : format(new Date(selected + "T00:00:00"), "EEEE")}</p>
              <h3 className="text-[18px] font-semibold tracking-[-0.02em] mt-0.5">{format(new Date(selected + "T00:00:00"), "d MMMM yyyy")}</h3>
              <p className="text-[12.5px] text-fg-faint mt-0.5">
                {agenda.length === 0 ? "Nothing planned" : `${agenda.length} note${agenda.length > 1 ? "s" : ""}`}
              </p>
            </div>
            <button className="btn btn-sm" onClick={() => newOn(selected)}>
              <Plus size={13} /> Add
            </button>
          </div>
          {agenda.length === 0 ? (
            <EmptyState icon={<CalendarDays size={18} />} title="A free day" body="Add a note to plan something here." action={{ label: "Schedule a note", onClick: () => newOn(selected) }} />
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {agenda.map((n, i) => (
                  <NoteCard key={n.id} note={n} files={files} compact index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
