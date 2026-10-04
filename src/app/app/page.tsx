"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { addDays, format, subDays } from "date-fns";
import { motion } from "motion/react";
import { ArrowRight, CalendarDays, Check, CheckSquare, Clock, FolderOpen, Pin, Plus, Sparkles, Target } from "lucide-react";
import { useFiles, useNotes } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import { upsertNote } from "@/lib/db";
import type { Note } from "@/lib/types";
import { formatBytes, toISODate } from "@/lib/utils";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Counter } from "@/components/app/Counter";
import { PRI_COLOR } from "@/components/app/NoteCard";

export default function Dashboard() {
  const notes = useNotes();
  const files = useFiles();
  const { openEditor } = useUI();

  const today = toISODate(new Date());
  const stats = useMemo(() => {
    const n = notes ?? [];
    const tasks = n.flatMap((x) => x.checklist);
    const done = tasks.filter((t) => t.done).length;
    return {
      notes: n.length,
      today: n.filter((x) => x.date === today).length,
      open: tasks.length - done,
      tasks: tasks.length,
      done,
      files: files?.length ?? 0,
      bytes: (files ?? []).reduce((a, f) => a + f.size, 0),
      progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  }, [notes, files, today]);

  const todays = (notes ?? []).filter((n) => n.date === today).sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
  const pinned = (notes ?? []).filter((n) => n.pinned).slice(0, 4);

  const upcoming = useMemo(() => {
    const end = toISODate(addDays(new Date(), 7));
    return (notes ?? [])
      .filter((n) => n.date && n.date > today && n.date <= end)
      .sort((a, b) => (a.date! + (a.time ?? "")).localeCompare(b.date! + (b.time ?? "")))
      .slice(0, 5);
  }, [notes, today]);

  // Every unchecked task across the vault, most urgent notes first.
  const openTasks = useMemo(() => {
    const rank = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
    return (notes ?? [])
      .flatMap((n) => n.checklist.filter((c) => !c.done).map((c) => ({ note: n, item: c })))
      .sort((a, b) => rank[a.note.priority] - rank[b.note.priority] || (a.note.date ?? "9").localeCompare(b.note.date ?? "9"))
      .slice(0, 6);
  }, [notes]);

  // 14-day activity (notes created or edited per day)
  const activity = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i));
    const counts = days.map((d) => {
      const iso = toISODate(d);
      return (notes ?? []).filter((n) => n.updatedAt.slice(0, 10) === iso || n.createdAt.slice(0, 10) === iso).length;
    });
    return { days, counts, max: Math.max(1, ...counts), total: counts.reduce((a, b) => a + b, 0) };
  }, [notes]);

  useEffect(() => {
    document.title = "Dashboard · MindVault";
  }, []);

  async function toggleTask(note: Note, id: string) {
    await upsertNote({ ...note, checklist: note.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) });
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-7 md:py-9">
      <PageHeader
        eyebrow={format(new Date(), "EEEE, d MMMM")}
        title={`Good ${greeting()}`}
        subtitle={
          notes === null
            ? "Opening your vault…"
            : stats.today > 0
              ? `You have ${stats.today} note${stats.today > 1 ? "s" : ""} scheduled today and ${stats.open} open task${stats.open === 1 ? "" : "s"}.`
              : `Nothing scheduled today — ${stats.open} open task${stats.open === 1 ? "" : "s"} across your vault.`
        }
        actions={
          <>
            <Link href="/app/ask" className="btn btn-sm">
              <Sparkles size={14} className="text-brand" /> Daily briefing
            </Link>
            <button className="btn btn-solid btn-sm" onClick={() => openEditor("new")}>
              <Plus size={14} /> New note
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi icon={<CalendarDays size={15} />} tint="#5b4bff" label="Due today" value={stats.today} foot={`${stats.notes} notes in total`} />
        <Kpi icon={<CheckSquare size={15} />} tint="#0a9fd8" label="Open tasks" value={stats.open} foot={`${stats.done} completed`} />
        <Kpi icon={<Target size={15} />} tint="#12a86f" label="Completion" value={stats.progress} suffix="%" foot={<Bar value={stats.progress} />} />
        <Kpi icon={<FolderOpen size={15} />} tint="#c27a06" label="Files" value={stats.files} foot={formatBytes(stats.bytes) + " on this device"} />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-5">
        <div className="space-y-5 min-w-0">
          {/* Today */}
          <Panel title="Today's agenda" action={{ href: "/app/calendar", label: "Calendar" }}>
            {notes === null ? (
              <Skeletons />
            ) : todays.length === 0 ? (
              <EmptyState icon={<CalendarDays size={18} />} title="Nothing scheduled today" body="Give a note a date and it shows up here." action={{ label: "Schedule a note", onClick: () => openEditor("new", { date: today }) }} />
            ) : (
              <ol className="relative">
                {todays.map((n, i) => (
                  <li key={n.id} className="relative pl-[76px] pb-3 last:pb-0">
                    <span className="absolute left-0 top-3 w-14 text-right text-[12.5px] font-medium tabular-nums text-fg-muted">{n.time ?? "All day"}</span>
                    <span className="absolute left-[64px] top-[18px] w-2 h-2 rounded-full ring-4 ring-bg-elev" style={{ background: PRI_COLOR[n.priority] }} />
                    {i < todays.length - 1 && <span className="absolute left-[67.5px] top-7 bottom-0 w-px bg-line" />}
                    <button
                      onClick={() => openEditor(n)}
                      className="w-full text-left rounded-xl border border-line bg-bg px-3.5 py-3 hover:border-line-strong hover:bg-bg-elev hover:shadow-[var(--shadow-card)] transition-[border-color,box-shadow,background]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1 min-w-0 truncate text-[14px] font-medium">{n.title || "Untitled"}</span>
                        <span className="chip" data-p={n.priority}>
                          {n.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[12px] text-fg-faint whitespace-nowrap min-w-0">
                        {n.endTime && (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Clock size={11} /> until {n.endTime}
                          </span>
                        )}
                        {n.checklist.length > 0 && (
                          <span className="tabular-nums">
                            {n.checklist.filter((c) => c.done).length}/{n.checklist.length} tasks
                          </span>
                        )}
                        {n.content && <span className="truncate">{n.content.split("\n")[0]}</span>}
                      </div>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          {/* Open tasks */}
          <Panel title="Open tasks" subtitle={stats.open > 0 ? `${stats.open} to do` : undefined} action={{ href: "/app/notes", label: "All notes" }}>
            {notes === null ? (
              <Skeletons />
            ) : openTasks.length === 0 ? (
              <EmptyState icon={<Check size={18} />} title="All caught up" body="Every task in your vault is done." />
            ) : (
              <ul className="divide-y divide-line -my-1">
                {openTasks.map(({ note, item }) => (
                  <motion.li key={item.id + note.id} layout className="flex items-center gap-3 py-2.5">
                    <button className="check" data-on={item.done} onClick={() => toggleTask(note, item.id)} aria-label={`Mark “${item.text}” done`}>
                      {item.done && <Check size={12} strokeWidth={3} />}
                    </button>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] truncate">{item.text}</span>
                      <button onClick={() => openEditor(note)} className="block text-[12px] text-fg-faint hover:text-brand truncate max-w-full text-left">
                        {note.title}
                      </button>
                    </span>
                    {note.date && <span className="text-[12px] text-fg-faint tabular-nums shrink-0">{note.date === today ? "Today" : format(new Date(note.date + "T00:00:00"), "d MMM")}</span>}
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRI_COLOR[note.priority] }} title={note.priority} />
                  </motion.li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5 min-w-0">
          {/* Activity */}
          <Panel title="Activity" subtitle={`${activity.total} edits · last 14 days`}>
            <div className="flex items-end gap-1.5 h-24" role="img" aria-label={`Notes edited per day over the last 14 days, ${activity.total} in total`}>
              {activity.counts.map((c, i) => (
                <div key={i} className="group relative flex-1 h-full flex items-end">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.025, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full rounded-[4px] origin-bottom"
                    style={{ height: `${Math.max(6, (c / activity.max) * 100)}%`, background: c === 0 ? "var(--line)" : i === 13 ? "var(--brand)" : "color-mix(in srgb, var(--brand) 45%, var(--bg-elev))" }}
                  />
                  <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-[#16181d] text-white text-[11px] px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                    {format(activity.days[i], "d MMM")} · {c}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[11px] text-fg-faint">
              <span>{format(activity.days[0], "d MMM")}</span>
              <span>Today</span>
            </div>
          </Panel>

          {/* Up next */}
          <Panel title="Next 7 days" action={{ href: "/app/calendar", label: "Open" }}>
            {notes === null ? (
              <Skeletons />
            ) : upcoming.length === 0 ? (
              <p className="text-[13px] text-fg-faint py-2">Nothing planned this week.</p>
            ) : (
              <ul className="space-y-1">
                {upcoming.map((n) => {
                  const d = new Date(n.date + "T00:00:00");
                  return (
                    <li key={n.id}>
                      <button onClick={() => openEditor(n)} className="w-full flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-glass-hover text-left transition-colors">
                        <span className="w-10 h-10 rounded-lg border border-line bg-bg flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9.5px] font-semibold uppercase text-fg-faint leading-none">{format(d, "EEE")}</span>
                          <span className="text-[14px] font-semibold leading-tight tabular-nums">{format(d, "d")}</span>
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13.5px] font-medium truncate">{n.title}</span>
                          <span className="block text-[12px] text-fg-faint">{n.time ? `${n.time}${n.endTime ? `–${n.endTime}` : ""}` : "All day"}</span>
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRI_COLOR[n.priority] }} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* Pinned */}
          {pinned.length > 0 && (
            <Panel title="Pinned" action={{ href: "/app/notes", label: "Notes" }}>
              <ul className="space-y-1">
                {pinned.map((n) => (
                  <li key={n.id}>
                    <button onClick={() => openEditor(n)} className="w-full flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-glass-hover text-left transition-colors">
                      <Pin size={14} className="text-brand mt-0.5 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13.5px] font-medium truncate">{n.title}</span>
                        {n.content && <span className="block text-[12px] text-fg-faint truncate">{n.content.split("\n")[0]}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "night" : h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}

function Kpi({ icon, tint, label, value, suffix = "", foot }: { icon: React.ReactNode; tint: string; label: string; value: number; suffix?: string; foot: React.ReactNode }) {
  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center gap-2 text-[13px] text-fg-muted font-medium">
        <span className="w-7 h-7 rounded-lg inline-flex items-center justify-center" style={{ background: `${tint}14`, color: tint }}>
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-3 text-[28px] md:text-[32px] font-semibold tracking-[-0.04em] leading-none tabular-nums">
        <Counter value={value} suffix={suffix} />
      </p>
      <div className="mt-2.5 text-[12px] text-fg-faint min-h-[18px] flex items-center">{foot}</div>
    </div>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <span className="w-full h-1.5 rounded-full bg-glass-hover overflow-hidden">
      <span className="block h-full rounded-full bg-ok transition-[width] duration-700" style={{ width: `${value}%` }} />
    </span>
  );
}

function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="card p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
          {subtitle && <p className="text-[12.5px] text-fg-faint mt-0.5">{subtitle}</p>}
        </div>
        {action && (
          <Link href={action.href} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-fg-muted hover:text-fg transition-colors shrink-0">
            {action.label} <ArrowRight size={13} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Skeletons() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-[52px]" />
      ))}
    </div>
  );
}
