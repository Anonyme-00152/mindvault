"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, RotateCcw, Sparkles, StickyNote } from "lucide-react";
import { seedNotes } from "@/lib/seed";
import { toISODate } from "@/lib/utils";
import { Markdown } from "@/components/Markdown";

const suggestions = ["What's my day?", "What should I focus on?", "What's left to do?", "Summarise everything"];

/** Live, unauthenticated demo: the server answers in local mode (never spends API credits). */
export function AskDemo() {
  const [notes] = useState(() => seedNotes());
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setBusy(true);
    setAsked(text);
    setAnswer("");
    setQ("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demo: true,
          lang: navigator.language,
          today: toISODate(new Date()),
          messages: [{ role: "user", content: text }],
          notes: notes.map((n) => ({
            title: n.title,
            content: n.content,
            date: n.date,
            time: n.time,
            priority: n.priority,
            category: n.category,
            tags: n.tags,
            checklist: n.checklist,
          })),
        }),
      });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setAnswer(acc);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setAnswer("The assistant is unreachable right now. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  const cited = new Set(notes.filter((n) => answer.includes(n.title)).map((n) => n.id));

  return (
    <section id="demo" className="s-section s-anchor relative bg-white border-y border-[var(--s-line)] overflow-hidden">
      <div className="absolute inset-0 s-dots-bg opacity-[0.35] [mask-image:linear-gradient(180deg,#000,transparent_60%)]" aria-hidden />
      <div className="s-container relative">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-28" data-reveal>
            <p className="s-eyebrow">Live demo</p>
            <h2 className="s-h2 mt-4">
              Ask anything.
              <br />
              <span className="s-serif s-grad-text">It only knows your notes.</span>
            </h2>
            <p className="s-lead mt-5 max-w-md">
              This is the real assistant, running on seven sample notes. Ask a question and watch the answer stream in —
              every claim points back to a note.
            </p>

            <div className="mt-8 rounded-2xl border border-[var(--s-line-2)] bg-white shadow-[var(--s-shadow)] focus-within:border-[var(--s-brand)] focus-within:shadow-[0_0_0_4px_rgba(91,75,255,0.12)] transition-[border-color,box-shadow]">
              <form
                className="flex items-center gap-2 p-2 pl-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(q);
                }}
              >
                <Sparkles size={17} className="text-[var(--s-brand)] shrink-0" />
                <input
                  className="flex-1 min-w-0 h-11 bg-transparent outline-none text-[15px] placeholder:text-[var(--s-faint)]"
                  placeholder="Ask the sample vault…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Ask the demo assistant"
                  enterKeyHint="send"
                />
                <button
                  className="s-btn s-btn-brand !h-10 !w-10 !p-0 !rounded-xl shrink-0"
                  disabled={busy || !q.trim()}
                  aria-label="Send question"
                >
                  {busy ? <span className="spinner !border-white/30 !border-t-white" /> : <ArrowUp size={17} />}
                </button>
              </form>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  disabled={busy}
                  className="h-9 px-3.5 rounded-full border border-[var(--s-line-2)] bg-white text-[13px] text-[var(--s-ink-2)] hover:border-[var(--s-brand)] hover:text-[var(--s-brand-ink)] transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-8 min-h-[120px]" aria-live="polite">
              {asked ? (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-br-md bg-[var(--s-ink)] text-white px-4 py-2.5 text-[14px] max-w-[85%]">{asked}</div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[var(--s-brand-soft)] text-[var(--s-brand)] inline-flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={15} />
                    </span>
                    <div className="flex-1 min-w-0 rounded-2xl rounded-tl-md border border-[var(--s-line)] bg-[var(--s-bg)] px-4 py-3.5 text-[14.5px] text-[var(--s-ink-2)] leading-relaxed [&_strong]:text-[var(--s-ink)] [&_strong]:font-semibold">
                      {answer ? <Markdown text={answer} /> : null}
                      {busy && <span className="s-caret" />}
                    </div>
                  </div>
                  {!busy && answer && (
                    <button
                      type="button"
                      onClick={() => {
                        setAsked(null);
                        setAnswer("");
                      }}
                      className="ml-11 inline-flex items-center gap-1.5 text-[13px] text-[var(--s-muted)] hover:text-[var(--s-ink)]"
                    >
                      <RotateCcw size={13} /> Clear
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-[var(--s-faint)]">
                  The public demo always runs in local mode — nothing is sent to an AI provider.
                </p>
              )}
            </div>
          </div>

          <div data-reveal="120">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[12.5px] font-semibold text-[var(--s-ink-2)] inline-flex items-center gap-2">
                <StickyNote size={14} className="text-[var(--s-faint)]" /> Sample vault · 7 notes
              </p>
              {cited.size > 0 && (
                <p className="text-[12.5px] text-[var(--s-brand-ink)] font-medium">
                  {cited.size} note{cited.size > 1 ? "s" : ""} cited
                </p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {notes.map((n) => {
                const on = cited.has(n.id);
                const dim = !!answer && !busy && cited.size > 0 && !on;
                return (
                  <article
                    key={n.id}
                    className="rounded-2xl border bg-white p-4 transition-[border-color,box-shadow,opacity,transform] duration-500"
                    style={{
                      borderColor: on ? "var(--s-brand)" : "var(--s-line)",
                      boxShadow: on ? "0 0 0 4px rgba(91,75,255,0.1), 0 12px 32px -12px rgba(91,75,255,0.35)" : "var(--s-shadow-sm)",
                      opacity: dim ? 0.5 : 1,
                      transform: on ? "translateY(-2px)" : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="s-chip" data-p={n.priority}>
                        {n.priority}
                      </span>
                      <span className="text-[11px] text-[var(--s-faint)] capitalize">{n.category}</span>
                    </div>
                    <h3 className="text-[14px] font-semibold leading-snug tracking-[-0.01em]">{n.title}</h3>
                    <p className="text-[12.5px] text-[var(--s-muted)] leading-relaxed line-clamp-2 mt-1">{n.content}</p>
                    {n.checklist.length > 0 && (
                      <p className="mt-2.5 text-[11.5px] text-[var(--s-faint)] tabular-nums">
                        {n.checklist.filter((c) => c.done).length}/{n.checklist.length} tasks
                        {n.time ? ` · ${n.time}` : ""}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
