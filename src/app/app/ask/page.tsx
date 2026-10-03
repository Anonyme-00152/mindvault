"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Sparkles, Trash2 } from "lucide-react";
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
      <div className="flex items-center gap-3 px-4 md:px-8 pt-5 pb-3 shrink-0">
        <div className="relative w-10 h-10 rounded-2xl bg-grad shrink-0 shadow-[0_8px_30px_-8px_rgba(139,124,255,.7)]">
          <span className="absolute inset-[3px] rounded-[13px] bg-bg/80 backdrop-blur flex items-center justify-center">
            <Sparkles size={16} className="text-brand" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[16px] font-medium leading-tight">Vault</h1>
          <p className="text-[12px] text-fg-muted flex items-center gap-1.5">
            <span className={cn("w-1.5 h-1.5 rounded-full", mode === "openai" ? "bg-ok" : "bg-brand")} />
            {mode === "openai" ? "Model connected" : mode === "local" ? "Demo mode · reads only your notes" : "…"}
          </p>
        </div>
        {messages && messages.length > 0 && (
          <button className="btn-icon" onClick={clear} aria-label="Clear conversation" title="Clear" data-cursor="hover">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 space-y-3 drawer-scroll">
        {empty && (
          <div className="pt-6 md:pt-12">
            <p className="display text-3xl md:text-4xl mb-2">
              Ask your vault<span className="serif-i text-brand">.</span>
            </p>
            <p className="text-fg-muted text-[14px] leading-relaxed max-w-md mb-6">Say hi, or ask about your day, your priorities, what&apos;s left — in any language. It only ever reads your notes.</p>
            <div className="flex flex-wrap gap-2">
              {prompts.map((p) => (
                <button key={p} className="chip !h-9 !px-3.5 !text-[13px] !font-sans !tracking-normal hover:!text-fg hover:!border-brand/60 transition-colors" onClick={() => send(p)} data-cursor="hover">
                  {p}
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
        className="shrink-0 px-3 md:px-8 pt-2"
        style={{ paddingBottom: "calc(0.75rem + var(--sab))" }}
      >
        <div className="glass !bg-bg-elev flex items-end gap-2 p-1.5 pl-4 focus-within:!border-brand/60 transition-colors">
          <textarea
            ref={box}
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-[15px] leading-6 py-2 placeholder:text-fg-faint max-h-[140px]"
            placeholder={lang === "fr" ? "Écris quelque chose…" : "Write something…"}
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
          <button className="btn btn-solid !w-10 !h-10 !px-0 shrink-0" disabled={busy || !input.trim()} aria-label="Send" data-cursor="hover">
            {busy ? <span className="spinner !border-accent-fg/30 !border-t-accent-fg" /> : <ArrowUp size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
}

function Bubble({ role, at, children }: { role: "user" | "assistant"; at?: string; children: React.ReactNode }) {
  const user = role === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className={cn("flex", user ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[88%] md:max-w-[80%] flex flex-col gap-1", user ? "items-end" : "items-start")}>
        <div className={user ? "rounded-2xl rounded-br-md bg-grad text-white px-4 py-2.5 text-[14.5px] leading-relaxed" : "rounded-2xl rounded-bl-md glass px-4 py-3 text-[14.5px] leading-relaxed"}>{children}</div>
        {at && <span className="font-mono text-[10px] text-fg-faint px-1">{new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>}
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
