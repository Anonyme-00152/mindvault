"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Download,
  FolderOpen,
  LayoutGrid,
  Lock,
  Plus,
  Search,
  Sparkles,
  StickyNote,
  ArrowUp,
} from "lucide-react";
import { BrandMark } from "./Brand";

/**
 * The hero's product shot, drawn in HTML so it stays razor sharp, light and
 * fully themeable. Content mirrors the app's real seed notes.
 */

const today = [
  { time: "07:00", title: "Run — 10k tempo", p: "medium", tag: "health", done: 1, total: 2 },
  { time: "14:00", title: "Portfolio case study — MindVault", p: "high", tag: "work", done: 1, total: 3 },
];
const week = [
  { day: "Mon", title: "Call with Léa — grant application", p: "urgent", tag: "meeting", done: 0, total: 1 },
  { day: "Tue", title: "Q4 budget — subscriptions audit", p: "medium", tag: "money", done: 1, total: 3 },
  { day: "Thu", title: "Weekend: Marseille", p: "low", tag: "travel", done: 1, total: 2 },
];

const ANSWER =
  "Start with **Portfolio case study** at 14:00 — it's high priority and 2 tasks are still open. Your 10k run is half done. Tomorrow, prep for the **Call with Léa**.";

function Bold({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
        p.startsWith("**") ? (
          <strong key={i} className="font-semibold text-[var(--s-ink)]">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function useTyped(text: string, start: boolean, speed = 16) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(text.length);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setN(Math.min(i, text.length));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, start, speed]);
  // Never cut through a ** marker mid-way
  let shown = text.slice(0, n);
  if ((shown.match(/\*\*/g)?.length ?? 0) % 2 === 1) shown += "**";
  return { shown, done: n >= text.length };
}

export function ProductWindow() {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setGo(true), 1300);
    return () => window.clearTimeout(t);
  }, []);
  const { shown, done } = useTyped(ANSWER, go);

  return (
    <div className="relative rounded-[18px] md:rounded-[22px] bg-[var(--s-surface)] border border-[var(--s-line)] shadow-[var(--s-shadow-lg)] overflow-hidden text-left select-none">
      {/* Window chrome */}
      <div className="h-11 flex items-center gap-3 px-4 border-b border-[var(--s-line)] bg-[#fcfcfb]">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="w-3 h-3 rounded-full bg-[#e3e3df]" />
          <span className="w-3 h-3 rounded-full bg-[#e3e3df]" />
          <span className="w-3 h-3 rounded-full bg-[#e3e3df]" />
        </div>
        <div className="mx-auto flex items-center gap-2 h-7 px-3 rounded-lg bg-[var(--s-subtle)] border border-[var(--s-line)] text-[12px] text-[var(--s-muted)] min-w-0 max-w-[60%]">
          <Lock size={11} className="shrink-0" />
          <span className="truncate">mindvault-xi.vercel.app/app</span>
        </div>
        <div className="w-[52px] hidden sm:block" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] lg:grid-cols-[210px_1fr_320px] h-[440px] sm:h-[480px] md:h-[540px]">
        {/* Sidebar */}
        <aside className="hidden sm:flex flex-col border-r border-[var(--s-line)] bg-[#fafaf8] p-3">
          <div className="flex items-center gap-2 px-2 h-9 mb-2">
            <BrandMark size={22} />
            <span className="text-[13.5px] font-semibold tracking-tight">MindVault</span>
          </div>
          <div className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-[var(--s-line)] bg-white text-[12px] text-[var(--s-faint)] mb-3">
            <Search size={13} /> Search
            <span className="ml-auto s-kbd">⌘K</span>
          </div>
          {[
            { i: LayoutGrid, l: "Dashboard", on: true },
            { i: StickyNote, l: "Notes", n: 7 },
            { i: CalendarDays, l: "Calendar" },
            { i: Sparkles, l: "Ask" },
            { i: FolderOpen, l: "Files", n: 12 },
            { i: Download, l: "Export" },
          ].map(({ i: Icon, l, on, n }) => (
            <div
              key={l}
              className={
                "flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] " +
                (on ? "bg-white border border-[var(--s-line)] shadow-[var(--s-shadow-sm)] text-[var(--s-ink)] font-medium" : "text-[var(--s-muted)]")
              }
            >
              <Icon size={15} className={on ? "text-[var(--s-brand)]" : ""} />
              {l}
              {n && <span className="ml-auto text-[11px] text-[var(--s-faint)] tabular-nums">{n}</span>}
            </div>
          ))}
          <p className="mt-5 mb-2 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--s-faint)]">Tags</p>
          {[
            ["portfolio", "#5b4bff"],
            ["running", "#0a9fd8"],
            ["travel", "#12a86f"],
            ["reading", "#c27a06"],
          ].map(([t, c]) => (
            <div key={t} className="flex items-center gap-2.5 h-7 px-2.5 text-[12.5px] text-[var(--s-muted)]">
              <span className="w-2 h-2 rounded-full" style={{ background: c }} />#{t}
            </div>
          ))}
          <div className="mt-auto rounded-xl border border-[var(--s-line)] bg-white p-3">
            <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--s-ink)]">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-[var(--s-mint)] s-ping" />
                <span className="relative w-2 h-2 rounded-full bg-[var(--s-mint)]" />
              </span>
              Stored on this device
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[var(--s-subtle)] overflow-hidden">
              <div className="h-full w-[18%] rounded-full bg-[var(--s-grad)]" />
            </div>
            <p className="mt-1.5 text-[10.5px] text-[var(--s-faint)] s-mono">2.4 MB · IndexedDB</p>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 p-4 sm:p-5 md:p-6 overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <p className="text-[11.5px] text-[var(--s-faint)] font-medium">Saturday, 3 October</p>
              <h3 className="text-[20px] md:text-[22px] font-semibold tracking-[-0.03em] mt-0.5">Good morning</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--s-ink)] text-white text-[12px] font-medium shrink-0">
              <Plus size={13} /> New note
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
            {[
              ["Due today", "2", "of 7 notes"],
              ["Open tasks", "6", "3 this week"],
              ["Focus", "68%", "tasks done"],
            ].map(([k, v, s]) => (
              <div key={k} className="rounded-xl border border-[var(--s-line)] bg-white p-2.5 sm:p-3">
                <p className="text-[10.5px] sm:text-[11px] text-[var(--s-faint)] font-medium truncate">{k}</p>
                <p className="text-[18px] sm:text-[22px] font-semibold tracking-[-0.03em] tabular-nums leading-tight mt-0.5">{v}</p>
                <p className="text-[10px] sm:text-[10.5px] text-[var(--s-faint)] truncate">{s}</p>
              </div>
            ))}
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--s-faint)] mb-2">Today</p>
          <div className="space-y-2 mb-5">
            {today.map((r) => (
              <Row key={r.title} lead={r.time} {...r} />
            ))}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--s-faint)] mb-2">This week</p>
          <div className="space-y-2">
            {week.map((r) => (
              <Row key={r.title} lead={r.day} {...r} />
            ))}
          </div>
        </main>

        {/* Assistant */}
        <aside className="hidden lg:flex flex-col border-l border-[var(--s-line)] bg-[#fcfcfb]">
          <div className="h-12 flex items-center justify-between px-4 border-b border-[var(--s-line)]">
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <span className="w-6 h-6 rounded-lg bg-[var(--s-brand-soft)] text-[var(--s-brand)] inline-flex items-center justify-center">
                <Sparkles size={13} />
              </span>
              Ask your vault
            </span>
            <span className="s-chip no-dot !normal-case">Grounded in 7 notes</span>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-hidden">
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-br-md bg-[var(--s-ink)] text-white px-3.5 py-2 text-[12.5px] max-w-[85%]">
                What should I focus on today?
              </div>
            </div>
            <div className="rounded-2xl rounded-bl-md bg-white border border-[var(--s-line)] px-3.5 py-3 text-[12.5px] leading-relaxed text-[var(--s-ink-2)] min-h-[92px]">
              {go ? (
                <span className={done ? "" : "s-caret"}>
                  <Bold text={shown} />
                </span>
              ) : (
                <span className="inline-flex gap-1 py-1" aria-hidden>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--s-faint)] animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--s-faint)] animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--s-faint)] animate-pulse [animation-delay:300ms]" />
                </span>
              )}
            </div>
            <div
              className="space-y-1.5 transition-opacity duration-700"
              style={{ opacity: done ? 1 : 0 }}
            >
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--s-faint)]">Sources</p>
              {["Portfolio case study — MindVault", "Call with Léa — grant application"].map((s) => (
                <div key={s} className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-[var(--s-brand-line)] bg-[var(--s-brand-soft)] text-[11.5px] text-[var(--s-brand-ink)] font-medium">
                  <StickyNote size={12} />
                  <span className="truncate">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 border-t border-[var(--s-line)]">
            <div className="flex items-center gap-2 h-10 pl-3 pr-1.5 rounded-xl border border-[var(--s-line-2)] bg-white text-[12.5px] text-[var(--s-faint)]">
              Ask anything about your notes…
              <span className="ml-auto w-7 h-7 rounded-lg bg-[var(--s-brand)] text-white inline-flex items-center justify-center">
                <ArrowUp size={14} />
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ lead, title, p, tag, done, total }: { lead: string; title: string; p: string; tag: string; done: number; total: number }) {
  return (
    <div className="flex items-center gap-3 h-11 sm:h-12 px-3 rounded-xl border border-[var(--s-line)] bg-white">
      <span className="s-check" data-on={done === total} aria-hidden>
        {done === total && <Check size={11} strokeWidth={3} />}
      </span>
      <span className="w-9 shrink-0 text-[11.5px] s-mono text-[var(--s-faint)] tabular-nums">{lead}</span>
      <span className="flex-1 min-w-0 truncate text-[13px] font-medium text-[var(--s-ink)]">{title}</span>
      <span className="hidden md:inline text-[11.5px] text-[var(--s-faint)]">#{tag}</span>
      <span className="s-chip" data-p={p}>
        {p}
      </span>
      <span className="hidden sm:inline-flex items-center gap-1.5 w-12 justify-end text-[11px] text-[var(--s-faint)] tabular-nums">
        <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden>
          <circle cx="10" cy="10" r="8" fill="none" stroke="#e8e8e4" strokeWidth="2.5" />
          <circle
            cx="10"
            cy="10"
            r="8"
            fill="none"
            stroke="#5b4bff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${(done / total) * 50.3} 50.3`}
            transform="rotate(-90 10 10)"
          />
        </svg>
        {done}/{total}
      </span>
    </div>
  );
}
