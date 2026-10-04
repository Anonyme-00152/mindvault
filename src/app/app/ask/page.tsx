"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, CalendarDays, FileText, ListChecks, Sparkles, Target, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { useMessages, useNotes } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import { cn, toISODate, uid } from "@/lib/utils";
import { Markdown } from "@/components/Markdown";

const PROMPTS: Record<string, string[]> = {
  en: ["What's my day?", "What should I focus on?", "What's left to do?", "Summarise everything"],
  fr: ["C'est quoi ma journée ?", "Sur quoi me concentrer ?", "Qu'est-ce qu'il me reste à faire ?", "Résume tout"],
  es: ["¿Qué tengo hoy?", "¿En qué me centro?", "¿Qué queda por hacer?", "Resume todo"],
  de: ["Was steht heute an?", "Worauf soll ich mich konzentrieren?", "Was ist noch offen?", "Fasse alles zusammen"],
  it: ["Cosa c'è oggi?", "Su cosa mi concentro?", "Cosa resta da fare?", "Riassumi tutto"],
  pt: ["O que tenho hoje?", "Em que me concentro?", "O que falta fazer?", "Resume tudo"],
};

function browserLang() {
  if (typeof navigator === "undefined") return "en";
  const l = (navigator.language || "en").slice(0, 2).toLowerCase();
  return PROMPTS[l] ? l : "en";
}

export default function AskPage() {
  const notes = useNotes();
  const messages = useMessages();
  const { notify } = useUI();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"unknown" | "local" | "openai">("unknown");
  const [lang, setLang] = useState("en");
  const bottom = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.title = "Ask · MindVault";
    setLang(browserLang());
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => setMode(d.mode))
      .catch(() => setMode("local"));
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length, streaming]);

  // auto-grow the composer
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(140, el.scrollHeight) + "px";
  }, [input]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy || !notes) return;
    setInput("");
    setBusy(true);
    const userMsg = { id: uid("m"), role: "user" as const, content: q, createdAt: new Date().toISOString() };
    await db.messages.add(userMsg);
    setStreaming("");
    try {
      const history = [...(messages ?? []), userMsg].slice(-12).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          today: toISODate(new Date()),
          lang,
          messages: history,
          notes: notes.map((n) => ({ title: n.title, content: n.content, date: n.date, time: n.time, endTime: n.endTime, priority: n.priority, category: n.category, tags: n.tags, checklist: n.checklist })),
        }),
      });
      if (!res.ok || !res.body) throw new Error("Assistant unavailable");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setStreaming(acc);
      }
      await db.messages.add({ id: uid("m"), role: "assistant", content: acc, createdAt: new Date().toISOString() });
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setStreaming(null);
      setBusy(false);
    }
  }

  async function clear() {
    await db.messages.clear();
    notify("Conversation cleared");
  }

  const empty = (!messages || messages.length === 0) && streaming === null;
  const prompts = PROMPTS[lang] ?? PROMPTS.en;

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-8 pt-5 pb-4 shrink-0 border-b border-line md:border-0">
        <span className="w-10 h-10 rounded-xl bg-grad text-white inline-flex items-center justify-center shrink-0 shadow-[0_8px_20px_-8px_rgba(91,75,255,0.7)]">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[16px] font-semibold tracking-[-0.01em] leading-tight">Vault assistant</h1>
          <p className="text-[12.5px] text-fg-muted flex items-center gap-1.5 mt-0.5">
            <span className={cn("w-1.5 h-1.5 rounded-full", mode === "openai" ? "bg-ok" : "bg-brand")} />
            {mode === "openai" ? "Model connected · reads only your notes" : mode === "local" ? "On-device mode · reads only your notes" : "Connecting…"}
          </p>
        </div>
        {messages && messages.length > 0 && (
          <button className="btn btn-sm" onClick={clear} aria-label="Clear conversation">
            <Trash2 size={14} /> <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-4 drawer-scroll">
        {empty && (
          <div className="pt-6 md:pt-14 text-center">
            <span className="w-14 h-14 mx-auto rounded-2xl bg-bg-elev border border-line shadow-[var(--shadow)] inline-flex items-center justify-center text-brand">
              <Sparkles size={22} />
            </span>
            <h2 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.03em] mt-5">What can I help you with?</h2>
            <p className="text-fg-muted text-[14.5px] leading-relaxed max-w-md mx-auto mt-2">
              Ask about your day, your priorities or what&apos;s left — in any language. Answers come only from your {notes?.length ?? 0} notes.
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5 mt-8 text-left">
              {prompts.map((p, i) => (
                <button
                  key={p}
                  className="group card px-4 py-3.5 hover:border-brand-line hover:shadow-[var(--shadow)] transition-[border-color,box-shadow] flex items-center gap-3"
                  onClick={() => send(p)}
                >
                  <span className="w-8 h-8 rounded-lg bg-glass-hover text-fg-muted group-hover:bg-brand-soft group-hover:text-brand inline-flex items-center justify-center shrink-0 transition-colors">
                    {[<CalendarDays key="a" size={15} />, <Target key="b" size={15} />, <ListChecks key="c" size={15} />, <FileText key="d" size={15} />][i % 4]}
                  </span>
                  <span className="text-[14px] font-medium">{p}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages?.map((m) => (
            <Bubble key={m.id} role={m.role} at={m.createdAt}>
              <Markdown text={m.content} />
            </Bubble>
          ))}
          {streaming !== null && (
            <Bubble key="streaming" role="assistant">
              {streaming ? <Markdown text={streaming} /> : <Typing />}
              {streaming && <span className="caret" />}
            </Bubble>
          )}
        </AnimatePresence>
        <div ref={bottom} className="h-1" />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="shrink-0 px-3 md:px-8 pt-2 pb-3"
      >
        <div className="card !rounded-2xl flex items-end gap-2 p-1.5 pl-4 shadow-[var(--shadow)] focus-within:!border-brand focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_14%,transparent)] transition-[border-color,box-shadow]">
          <textarea
            ref={box}
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-[15px] leading-6 py-2 placeholder:text-fg-faint max-h-[140px]"
            placeholder={lang === "fr" ? "Pose une question sur tes notes…" : "Ask anything about your notes…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            disabled={busy}
            aria-label="Message"
            enterKeyHint="send"
          />
          <button className="btn btn-brand !w-10 !h-10 !px-0 !rounded-xl shrink-0" disabled={busy || !input.trim()} aria-label="Send">
            {busy ? <span className="spinner !border-white/30 !border-t-white" /> : <ArrowUp size={17} />}
          </button>
        </div>
        <p className="text-center text-[11.5px] text-fg-faint mt-2 hidden sm:block">Enter to send · Shift + Enter for a new line</p>
      </form>
    </div>
  );
}

function Bubble({ role, at, children }: { role: "user" | "assistant"; at?: string; children: React.ReactNode }) {
  const user = role === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className={cn("flex gap-3", user ? "justify-end" : "justify-start")}>
      {!user && (
        <span className="w-8 h-8 rounded-lg bg-grad text-white inline-flex items-center justify-center shrink-0 mt-0.5 shadow-[0_6px_14px_-6px_rgba(91,75,255,0.7)]">
          <Sparkles size={14} />
        </span>
      )}
      <div className={cn("max-w-[85%] md:max-w-[80%] flex flex-col gap-1 min-w-0", user ? "items-end" : "items-start")}>
        <div
          className={
            user
              ? "rounded-2xl rounded-br-md bg-accent text-accent-fg px-4 py-2.5 text-[14.5px] leading-relaxed"
              : "rounded-2xl rounded-tl-md grad-border shadow-[var(--shadow-card)] px-4 py-3 text-[14.5px] leading-relaxed text-fg [&_strong]:font-semibold"
          }
        >
          {children}
        </div>
        {at && <span className="text-[11px] text-fg-faint px-1 tabular-nums">{new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>}
      </div>
    </motion.div>
  );
}

function Typing() {
  return (
    <span className="inline-flex items-center gap-1 h-5" aria-label="Typing">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-fg-muted animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}
