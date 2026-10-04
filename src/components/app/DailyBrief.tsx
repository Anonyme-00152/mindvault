"use client";

import Link from "next/link";
import { Fragment, useMemo } from "react";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { dailyBrief } from "@/lib/brief";
import type { Note } from "@/lib/types";
import { useUI } from "@/lib/store";

/** Splits "**bold** text" into word tokens so each word can fade in on its own beat. */
function tokens(line: string) {
  const out: { w: string; b: boolean }[] = [];
  line.split(/(\*\*[^*]+\*\*)/g).forEach((part) => {
    if (!part) return;
    const bold = part.startsWith("**");
    (bold ? part.slice(2, -2) : part).split(/(\s+)/).forEach((w) => w && out.push({ w, b: bold }));
  });
  return out;
}

export function DailyBrief({ notes }: { notes: Note[] }) {
  const { openEditor } = useUI();
  // Recompute when notes change, but keep the animation keyed to content so edits re-reveal gently.
  const brief = useMemo(() => dailyBrief(notes), [notes]);
  const key = brief.lines.join("|");
  let i = 0;

  return (
    <section className="relative rounded-2xl grad-border shadow-[var(--shadow)] overflow-hidden mb-6" aria-label="Daily brief">
      <div className="absolute inset-0 aurora pointer-events-none" aria-hidden />
      <div className="relative p-5 md:p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="relative w-8 h-8 rounded-xl bg-grad text-white inline-flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(91,75,255,0.7)] shine-sweep">
            <Sparkles size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold leading-tight">Daily brief</p>
            <p className="text-[11.5px] text-fg-faint leading-tight">Written on this device from your notes</p>
          </div>
        </div>

        <div key={key} className="text-[15.5px] md:text-[17px] leading-[1.6] tracking-[-0.01em] text-fg-muted max-w-3xl space-y-1.5">
          {brief.lines.map((line, li) => (
            <p key={li}>
              {tokens(line).map((t, ti) => {
                const delay = Math.min(i++ * 18, 1600);
                return /^\s+$/.test(t.w) ? (
                  <Fragment key={ti}>{t.w}</Fragment>
                ) : (
                  <span key={ti} className={"brief-word " + (t.b ? "font-semibold text-fg" : "")} style={{ animationDelay: `${delay}ms` }}>
                    {t.w}
                  </span>
                );
              })}
            </p>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-5">
          {brief.next && (
            <button className="btn btn-solid btn-sm" onClick={() => openEditor(brief.next!)}>
              Open {brief.next.title.length > 28 ? brief.next.title.slice(0, 28) + "…" : brief.next.title} <ArrowRight size={14} />
            </button>
          )}
          <Link href="/app/ask" className="btn btn-sm">
            <MessageCircle size={14} className="text-brand" /> Ask a follow-up
          </Link>
        </div>
      </div>
    </section>
  );
}
