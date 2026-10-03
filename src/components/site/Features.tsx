"use client";

import { useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  CornerDownLeft,
  FileArchive,
  FileJson,
  FileText,
  FolderOpen,
  ImageIcon,
  Search,
  Smartphone,
  Sparkles,
  StickyNote,
  Video,
  WifiOff,
} from "lucide-react";

function Head({ icon: Icon, title, body }: { icon: typeof StickyNote; title: string; body: string }) {
  return (
    <div className="p-6 md:p-7 pb-0 md:pb-0">
      <span className="w-9 h-9 rounded-xl border border-[var(--s-line)] bg-[var(--s-subtle)] text-[var(--s-ink)] inline-flex items-center justify-center mb-4">
        <Icon size={17} />
      </span>
      <h3 className="s-h3">{title}</h3>
      <p className="s-body mt-1.5 max-w-[34ch]">{body}</p>
    </div>
  );
}

function NotesCard() {
  const [items, setItems] = useState([
    { t: "Record the vault-opening sequence", on: true },
    { t: "Write the “why” paragraph", on: false },
    { t: "Export OG image 1200×630", on: false },
  ]);
  const done = items.filter((i) => i.on).length;
  return (
    <div className="s-card s-card-hover lg:col-span-4 overflow-hidden grid md:grid-cols-[1fr_1.15fr]">
      <div className="flex flex-col">
        <Head icon={StickyNote} title="Notes that hold everything" body="Text, checklists, tags, priority, dates and attachments in a single card. Pin what matters, find anything." />
        <div className="px-6 md:px-7 pb-6 md:pb-7 pt-5 mt-auto flex flex-wrap gap-2">
          {["Markdown", "Checklists", "Tags", "Priorities", "Attachments"].map((t) => (
            <span key={t} className="s-chip no-dot !normal-case !h-7 !px-2.5 !text-[12px] !rounded-lg">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="relative bg-[var(--s-subtle)] border-t md:border-t-0 md:border-l border-[var(--s-line)] p-5 md:p-7 flex items-center">
        <div className="absolute inset-0 s-dots-bg opacity-50" aria-hidden />
        <div className="relative w-full rounded-2xl bg-white border border-[var(--s-line)] shadow-[var(--s-shadow)] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="s-chip" data-p="high">high</span>
            <span className="text-[11px] s-mono text-[var(--s-faint)]">Today · 14:00</span>
          </div>
          <p className="text-[15px] font-semibold tracking-[-0.015em]">Portfolio case study — MindVault</p>
          <p className="text-[13px] text-[var(--s-muted)] mt-1.5 leading-relaxed">
            Write the story, not the feature list. Context → constraints → craft → outcome.
          </p>
          <div className="mt-4 h-1.5 rounded-full bg-[var(--s-subtle)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--s-brand)] transition-[width] duration-500" style={{ width: `${(done / items.length) * 100}%` }} />
          </div>
          <ul className="mt-3 space-y-1">
            {items.map((it, i) => (
              <li key={it.t}>
                <button
                  type="button"
                  onClick={() => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))}
                  className="w-full flex items-center gap-2.5 h-8 px-1.5 -mx-1.5 rounded-lg hover:bg-[var(--s-subtle)] text-left text-[13px] transition-colors"
                  aria-pressed={it.on}
                >
                  <span className="s-check" data-on={it.on}>
                    {it.on && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className={it.on ? "line-through text-[var(--s-faint)]" : "text-[var(--s-ink-2)]"}>{it.t}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-1.5">
            {["#portfolio", "#design"].map((t) => (
              <span key={t} className="text-[11.5px] text-[var(--s-brand-ink)] bg-[var(--s-brand-soft)] rounded-md px-1.5 py-0.5">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CommandCard() {
  return (
    <div className="s-card s-card-hover lg:col-span-2 overflow-hidden flex flex-col">
      <Head icon={Search} title="Everything is one shortcut away" body="⌘K opens a command palette that searches notes, jumps between views and creates on the fly." />
      <div className="p-5 md:p-6 mt-auto">
        <div className="rounded-2xl bg-white border border-[var(--s-line)] shadow-[var(--s-shadow)] overflow-hidden">
          <div className="flex items-center gap-2 h-11 px-3.5 border-b border-[var(--s-line)] text-[13px]">
            <Search size={14} className="text-[var(--s-faint)]" />
            <span className="text-[var(--s-ink)]">mars</span>
            <span className="w-px h-4 bg-[var(--s-brand)] animate-pulse" />
            <span className="ml-auto s-kbd">esc</span>
          </div>
          <div className="p-1.5 text-[12.5px]">
            <p className="px-2.5 pt-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--s-faint)]">Notes</p>
            <div className="flex items-center gap-2.5 h-9 px-2.5 rounded-lg bg-[var(--s-brand-soft)] text-[var(--s-brand-ink)] font-medium">
              <StickyNote size={14} />
              <span>
                Weekend: <mark className="bg-transparent text-inherit underline decoration-2 underline-offset-2">Mars</mark>eille
              </span>
              <CornerDownLeft size={13} className="ml-auto opacity-70" />
            </div>
            <p className="px-2.5 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--s-faint)]">Go to</p>
            {[
              [CalendarDays, "Calendar", "3"],
              [Sparkles, "Ask", "4"],
            ].map(([I, l, k]) => {
              const Icon = I as typeof Search;
              return (
                <div key={l as string} className="flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[var(--s-ink-2)]">
                  <Icon size={14} className="text-[var(--s-faint)]" /> {l as string}
                  <span className="ml-auto s-kbd">{k as string}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarCard() {
  const marks: Record<number, string> = { 5: "#12a86f", 7: "#0a9fd8", 12: "#5b4bff", 15: "#c27a06", 21: "#12a86f", 26: "#0a9fd8" };
  // October 2026 starts on a Thursday → 3 leading blanks (Mon-first grid)
  const cells = Array.from({ length: 35 }, (_, i) => i - 2);
  return (
    <div className="s-card s-card-hover lg:col-span-2 overflow-hidden flex flex-col">
      <Head icon={CalendarDays} title="Time, laid out" body="A month at a glance, an agenda beside it. Export any note to your phone's calendar in one tap." />
      <div className="p-5 md:p-6 mt-auto">
        <div className="rounded-2xl bg-white border border-[var(--s-line)] shadow-[var(--s-shadow)] p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[13px] font-semibold">October 2026</span>
            <span className="text-[11px] text-[var(--s-faint)] s-mono">Week 40</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="text-[10px] font-medium text-[var(--s-faint)] py-0.5">
                {d}
              </span>
            ))}
            {cells.map((d) => {
              const inMonth = d >= 1 && d <= 31;
              const isToday = d === 3;
              return (
                <span
                  key={d}
                  className={
                    "relative aspect-square rounded-lg text-[11px] flex items-center justify-center tabular-nums " +
                    (isToday ? "bg-[var(--s-ink)] text-white font-semibold" : inMonth ? "text-[var(--s-ink-2)] hover:bg-[var(--s-subtle)]" : "text-transparent")
                  }
                >
                  {inMonth ? d : "·"}
                  {marks[d] && <span className="absolute bottom-[3px] w-1 h-1 rounded-full" style={{ background: marks[d] }} />}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReminderCard() {
  return (
    <div className="s-card s-card-hover lg:col-span-2 overflow-hidden flex flex-col">
      <Head icon={Bell} title="Reminders that reach you" body="Give a note a time and get a push notification on your phone — even when the app is closed." />
      <div className="relative p-5 md:p-6 mt-auto">
        <div className="relative rounded-[26px] bg-[linear-gradient(160deg,#e9e6ff,#dff3fb_55%,#e2f6ec)] p-4 pt-10 overflow-hidden border border-[var(--s-line)]">
          <p className="absolute top-3 inset-x-0 text-center text-[11px] font-semibold text-[var(--s-ink-2)] tabular-nums">13:45</p>
          <div className="s-float rounded-2xl bg-white/85 backdrop-blur border border-white shadow-[var(--s-shadow)] p-3 flex gap-3">
            <span className="w-9 h-9 rounded-[10px] bg-[var(--s-ink)] text-white inline-flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 64 64" aria-hidden>
                <path d="M19 45V20l13 15 13-15v25" fill="none" stroke="#a69dff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12.5px] font-semibold">MindVault</p>
                <p className="text-[10.5px] text-[var(--s-faint)]">now</p>
              </div>
              <p className="text-[12.5px] text-[var(--s-ink-2)] leading-snug">Portfolio case study starts in 15 min · 2 tasks left</p>
            </div>
          </div>
          <div className="mt-2 mx-3 h-3 rounded-b-2xl bg-white/50" />
        </div>
      </div>
    </div>
  );
}

function OfflineCard() {
  return (
    <div className="s-card s-card-hover lg:col-span-2 overflow-hidden flex flex-col">
      <Head icon={Smartphone} title="An app, not a tab" body="Install it on your iPhone or desktop. It opens instantly and keeps working without a connection." />
      <div className="p-5 md:p-6 mt-auto grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-[var(--s-line)] p-4">
          <WifiOff size={18} className="text-[var(--s-brand)]" />
          <p className="text-[13px] font-semibold mt-3">Offline-ready</p>
          <p className="text-[11.5px] text-[var(--s-faint)] mt-0.5">Service worker cache</p>
        </div>
        <div className="rounded-2xl bg-white border border-[var(--s-line)] p-4">
          <Smartphone size={18} className="text-[var(--s-sky)]" />
          <p className="text-[13px] font-semibold mt-3">Installable</p>
          <p className="text-[11.5px] text-[var(--s-faint)] mt-0.5">Home screen PWA</p>
        </div>
      </div>
    </div>
  );
}

function FilesCard() {
  const files = [
    { n: "IMG_2041.jpg", i: ImageIcon, bg: "linear-gradient(135deg,#d9d3ff,#cdeefb)" },
    { n: "brief.pdf", i: FileText, bg: "repeating-linear-gradient(0deg,#ececea 0 2px,#fff 2px 7px)" },
    { n: "sormiou.mov", i: Video, bg: "linear-gradient(160deg,#bfe7f7,#c9eedc)" },
    { n: "cover.png", i: ImageIcon, bg: "radial-gradient(circle at 30% 30%,#e6e2ff,#f5f5f2 70%)" },
  ];
  return (
    <div className="s-card s-card-hover lg:col-span-3 overflow-hidden grid sm:grid-cols-[1fr_1.1fr] lg:grid-cols-1">
      <div className="flex flex-col">
        <Head icon={FolderOpen} title="Files, kept close" body="Images, video and documents stored in your browser's own database, previewed in place, attached to any note." />
      </div>
      <div className="p-5 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-2.5 content-center">
        {files.map(({ n, i: Icon, bg }) => (
          <div key={n} className="rounded-xl border border-[var(--s-line)] bg-white p-1.5 shadow-[var(--s-shadow-sm)]">
            <div className="aspect-[4/3] rounded-lg flex items-center justify-center" style={{ background: bg }}>
              <Icon size={18} className="text-[var(--s-ink-2)] opacity-60" />
            </div>
            <p className="text-[10.5px] s-mono text-[var(--s-muted)] truncate mt-1.5 px-0.5">{n}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportCard() {
  const formats = [
    { i: FileArchive, t: "ZIP archive", d: "Markdown + files", c: "#5b4bff" },
    { i: FileText, t: "PDF document", d: "Printable, paginated", c: "#0a9fd8" },
    { i: FileJson, t: "Full backup", d: "Move between devices", c: "#12a86f" },
    { i: CalendarDays, t: "Calendar (.ics)", d: "Apple, Google, Outlook", c: "#c27a06" },
  ];
  return (
    <div className="s-card s-card-hover lg:col-span-3 overflow-hidden grid sm:grid-cols-[1fr_1.1fr] lg:grid-cols-1">
      <Head icon={FileArchive} title="Leave whenever you like" body="No lock-in. Take everything with you in open formats, filtered by week, month, year or all time." />
      <div className="p-5 md:p-6 grid gap-2 lg:grid-cols-2 content-center">
        {formats.map(({ i: Icon, t, d, c }) => (
          <div key={t} className="flex items-center gap-3 h-12 px-3 rounded-xl border border-[var(--s-line)] bg-white">
            <span className="w-7 h-7 rounded-lg inline-flex items-center justify-center" style={{ background: `${c}14`, color: c }}>
              <Icon size={14} />
            </span>
            <span className="text-[13px] font-medium whitespace-nowrap">{t}</span>
            <span className="ml-auto text-[11.5px] text-[var(--s-faint)] hidden sm:inline truncate">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="s-section s-anchor relative">
      <div className="s-container">
        <div className="max-w-2xl" data-reveal>
          <p className="s-eyebrow">Features</p>
          <h2 className="s-h2 mt-4">
            Everything you think about,
            <br className="hidden sm:block" /> <span className="text-[var(--s-faint)]">in one quiet place.</span>
          </h2>
          <p className="s-lead mt-5 max-w-xl">
            Five apps&apos; worth of notes, tasks, dates and files — folded into a single workspace that loads instantly and
            never asks for an account.
          </p>
        </div>

        <div className="mt-12 md:mt-16 grid gap-4 md:gap-5 lg:grid-cols-6" data-reveal="120">
          <NotesCard />
          <CommandCard />
          <CalendarCard />
          <ReminderCard />
          <OfflineCard />
          <FilesCard />
          <ExportCard />
        </div>
      </div>
    </section>
  );
}
