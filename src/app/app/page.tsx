"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { format, subDays } from "date-fns";
import { ArrowUpRight, CheckSquare, FolderOpen, Sparkles, StickyNote, TrendingUp } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useFiles, useNotes } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import { toISODate } from "@/lib/utils";
import { NoteCard } from "@/components/app/NoteCard";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Counter } from "@/components/app/Counter";

export default function Dashboard() {
  const notes = useNotes();
  const files = useFiles();
  const { openEditor } = useUI();
  const root = useRef<HTMLDivElement>(null);

  const today = toISODate(new Date());
  const stats = useMemo(() => {
    const n = notes ?? [];
    const tasks = n.flatMap((x) => x.checklist);
    const done = tasks.filter((t) => t.done).length;
    return {
      notes: n.length,
      today: n.filter((x) => x.date === today).length,
      tasks: tasks.length,
      done,
      files: files?.length ?? 0,
      progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  }, [notes, files, today]);

  const todays = (notes ?? []).filter((n) => n.date === today).sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
  const pinned = (notes ?? []).filter((n) => n.pinned);
  const recent = (notes ?? []).slice(0, 5);

  // 14-day activity sparkline (notes touched per day)
  const activity = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => toISODate(subDays(new Date(), 13 - i)));
    const counts = days.map((d) => (notes ?? []).filter((n) => n.updatedAt.slice(0, 10) === d || n.createdAt.slice(0, 10) === d).length);
    const max = Math.max(1, ...counts);
    return { days, counts, max };
  }, [notes]);

  useGSAP(
    () => {
      if (!notes) return;
      gsap.from(".stat", { y: 18, opacity: 0, stagger: 0.06, duration: 0.8 });
      gsap.from(".spark-bar", { scaleY: 0, transformOrigin: "bottom", stagger: 0.03, duration: 0.7, delay: 0.2 });
    },
    { scope: root, dependencies: [notes === null] },
  );

  useEffect(() => {
    document.title = "Dashboard · MindVault";
  }, []);

  return (
    <div ref={root} className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <PageHeader
        eyebrow={format(new Date(), "EEEE d MMMM yyyy")}
        title={
          <>
            Good {greeting()}<span className="serif-i text-brand">.</span>
          </>
        }
        subtitle={
          stats.today > 0
            ? `${stats.today} note${stats.today > 1 ? "s" : ""} scheduled today.`
            : "Nothing scheduled today. A clean slate."
        }
        actions={
          <>
            <button className="btn btn-solid btn-sm" onClick={() => openEditor("new")} data-cursor="hover">
              New note
            </button>
            <Link href="/app/ask" className="btn btn-ghost btn-sm" data-cursor="hover">
              <Sparkles size={14} /> Briefing
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Stat icon={<StickyNote size={16} />} label="Notes" value={stats.notes} sub={`${stats.today} today`} />
        <Stat icon={<CheckSquare size={16} />} label="Tasks" value={stats.tasks} sub={`${stats.done} done`} />
        <Stat icon={<FolderOpen size={16} />} label="Files" value={stats.files} sub="stored locally" />
        <Stat icon={<TrendingUp size={16} />} label="Progress" value={stats.progress} suffix="%" sub="of tasks complete" />
      </div>

      <div className="stat glass p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="eyebrow">Activity · last 14 days</p>
          <p className="font-mono text-[11px] text-fg-faint">{activity.counts.reduce((a, b) => a + b, 0)} touches</p>
        </div>
        <div className="flex items-end gap-1.5 h-16">
          {activity.counts.map((c, i) => (
            <div
              key={i}
              className="spark-bar flex-1 rounded-sm transition-opacity hover:opacity-100"
              style={{ height: `${Math.max(6, (c / activity.max) * 100)}%`, opacity: c === 0 ? 0.12 : 0.85, background: c === 0 ? "var(--fg)" : "var(--grad)" }}
              title={`${activity.days[i]}: ${c}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 font-mono text-[10px] text-fg-faint">
          <span>{format(subDays(new Date(), 13), "d MMM")}</span>
          <span>Today</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section>
          <SectionTitle title="Today" href="/app/calendar" />
          {notes === null ? (
            <Skeletons />
          ) : todays.length === 0 ? (
            <EmptyState title="Nothing today" body="Schedule a note to see it here." action={{ label: "New note", onClick: () => openEditor("new") }} />
          ) : (
            <div className="space-y-2">
              {todays.map((n, i) => (
                <NoteCard key={n.id} note={n} files={files} compact index={i} />
              ))}
            </div>
          )}
        </section>
        <section>
          <SectionTitle title={pinned.length ? "Pinned" : "Recent"} href="/app/notes" />
          {notes === null ? (
            <Skeletons />
          ) : (pinned.length ? pinned : recent).length === 0 ? (
            <EmptyState title="No notes yet" body="Your vault is empty. Start with anything." action={{ label: "Create a note", onClick: () => openEditor("new") }} />
          ) : (
            <div className="space-y-2">
              {(pinned.length ? pinned : recent).slice(0, 5).map((n, i) => (
                <NoteCard key={n.id} note={n} files={files} compact index={i} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "night" : h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}

function Stat({ icon, label, value, sub, suffix = "" }: { icon: React.ReactNode; label: string; value: number; sub: string; suffix?: string }) {
  return (
    <div className="stat glass glass-hover p-4 md:p-5">
      <div className="flex items-center justify-between text-fg-faint mb-4">
        <span className="text-brand">{icon}</span>
        <span className="font-mono text-[10px]">{sub}</span>
      </div>
      <p className="display text-3xl md:text-4xl">
        <Counter value={value} suffix={suffix} />
      </p>
      <p className="text-[13px] text-fg-muted mt-1">{label}</p>
    </div>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[15px] font-medium">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-[12px] text-fg-muted hover:text-fg transition-colors" data-cursor="hover">
        View all <ArrowUpRight size={12} />
      </Link>
    </div>
  );
}

function Skeletons() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-[62px]" />
      ))}
    </div>
  );
}
