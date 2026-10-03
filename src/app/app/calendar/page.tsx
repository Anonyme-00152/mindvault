"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useFiles, useNotes } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import { toISODate } from "@/lib/utils";
import { NoteCard } from "@/components/app/NoteCard";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";

const PRI_DOT: Record<string, string> = { urgent: "#ff5d5d", high: "#ffb020", medium: "#e8e06b", low: "#4ade80" };

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
    const m = new Map<string, typeof notes>();
    (notes ?? []).forEach((n) => {
      if (!n.date) return;
      m.set(n.date, [...(m.get(n.date) ?? []), n]);
    });
    return m;
  }, [notes]);

  const today = toISODate(new Date());
  const agenda = (byDate.get(selected) ?? []).slice().sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));

  function go(delta: number) {
    setDir(delta);
    setMonth((m) => (delta > 0 ? addMonths(m, 1) : subMonths(m, 1)));
  }

  function newOn(date: string) {
    openEditor("new", { date });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <PageHeader
        eyebrow={`Week ${format(new Date(selected + "T00:00:00"), "I")}`}
        title={
          <>
            Calendar<span className="serif-i text-brand">.</span>
          </>
        }
        actions={
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setMonth(startOfMonth(new Date()));
              setSelected(today);
            }}
            data-cursor="hover"
          >
            Today
          </button>
        }
      />

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="glass p-4 md:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <button className="btn-icon" onClick={() => go(-1)} aria-label="Previous month" data-cursor="hover">
              <ChevronLeft size={16} />
            </button>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h2
                key={month.toISOString()}
                initial={{ opacity: 0, x: dir * 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -dir * 16 }}
                transition={{ duration: 0.25 }}
                className="display text-2xl md:text-3xl"
              >
                {format(month, "MMMM")} <span className="serif-i text-grad">{format(month, "yyyy")}</span>
              </motion.h2>
            </AnimatePresence>
            <button className="btn-icon" onClick={() => go(1)} aria-label="Next month" data-cursor="hover">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="eyebrow text-center py-1">
                {d}
              </span>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={month.toISOString()}
              initial={{ opacity: 0, x: dir * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir * 30 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-7 gap-1"
            >
              {days.map((d) => {
                const iso = toISODate(d);
                const items = byDate.get(iso) ?? [];
                return (
                  <button
                    key={iso}
                    className="cal-cell text-left"
                    data-today={iso === today}
                    data-selected={iso === selected}
                    data-outside={!isSameMonth(d, month)}
                    onClick={() => setSelected(iso)}
                    onDoubleClick={() => newOn(iso)}
                    data-cursor="hover"
                  >
                    <span className="text-[13px] font-medium">{format(d, "d")}</span>
                    {items.length > 0 && (
                      <span className="absolute left-2 right-2 bottom-2 flex items-center gap-1">
                        {items.slice(0, 4).map((n) => (
                          <span key={n.id} className="w-1.5 h-1.5 rounded-full" style={{ background: iso === selected ? "currentColor" : PRI_DOT[n.priority] }} />
                        ))}
                        {items.length > 4 && <span className="font-mono text-[9px] opacity-60">+{items.length - 4}</span>}
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
          <p className="text-[11px] text-fg-faint mt-4">Double-click a day to schedule a note.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="eyebrow">{selected === today ? "Today" : "Agenda"}</p>
              <h3 className="text-[17px] font-medium mt-1">{format(new Date(selected + "T00:00:00"), "EEEE d MMMM")}</h3>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => newOn(selected)} data-cursor="hover">
              <Plus size={13} /> Add
            </button>
          </div>
          {agenda.length === 0 ? (
            <EmptyState title="Nothing planned" body="Add a note to this day." action={{ label: "Schedule a note", onClick: () => newOn(selected) }} />
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {agenda.map((n, i) => (
                  <NoteCard key={n.id} note={n} files={files} compact index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
