"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, KeyRound, PenLine, Plus, Sparkles } from "lucide-react";
import { scrollToHash } from "./Nav";

/* ── Stats band ─────────────────────────────────────────────────────────── */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(to);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setV(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / 1400);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref} className="tabular-nums">
      {v}
      {suffix}
    </span>
  );
}

const stats = [
  { n: 0, s: "", l: "accounts to create", sub: "Sign in and start writing" },
  { n: 100, s: "%", l: "of your notes on-device", sub: "Stored in IndexedDB" },
  { n: 0, s: "", l: "bytes of tracking", sub: "No analytics, no telemetry" },
  { n: 7, s: " days", l: "per signed session", sub: "Then sign in again" },
];

export function Stats() {
  return (
    <section className="relative border-y border-[var(--s-line)] bg-white">
      <div className="s-container grid grid-cols-2 lg:grid-cols-4" data-reveal>
        {stats.map((x, i) => (
          <div
            key={x.l}
            className={
              "py-8 md:py-10 px-2 sm:px-6 " +
              (i % 2 === 1 ? "pl-5 sm:pl-6 border-l border-[var(--s-line)] " : "") +
              (i >= 2 ? "border-t lg:border-t-0 border-[var(--s-line)] " : "") +
              (i === 2 ? "lg:border-l " : "")
            }
          >
            <p className="text-[34px] md:text-[44px] font-semibold tracking-[-0.045em] leading-none">
              <CountUp to={x.n} suffix={x.s} />
            </p>
            <p className="mt-3 text-[14px] font-medium text-[var(--s-ink)]">{x.l}</p>
            <p className="mt-0.5 text-[12.5px] text-[var(--s-faint)]">{x.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── How it works ───────────────────────────────────────────────────────── */
const steps = [
  {
    i: KeyRound,
    t: "Open the vault",
    b: "Sign in with your identifier. The session is signed server-side — your notes never touch it.",
    k: "/login",
  },
  {
    i: PenLine,
    t: "Capture anything",
    b: "Notes, checklists, dates, files. Press ⌘K to reach anything, ⌘N to start a new note.",
    k: "⌘K",
  },
  {
    i: Sparkles,
    t: "Ask, then act",
    b: "“What's my day?” The assistant reads your vault, answers in seconds and cites its sources.",
    k: "Ask",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="s-section s-anchor relative bg-white border-y border-[var(--s-line)]">
      <div className="s-container">
        <div className="text-center max-w-2xl mx-auto" data-reveal>
          <p className="s-eyebrow">How it works</p>
          <h2 className="s-h2 mt-4">Up and running in under a minute.</h2>
          <p className="s-lead mt-5">No onboarding flow, no workspace to configure, no import wizard. Just a quiet place to think.</p>
        </div>
        <ol className="mt-14 md:mt-16 grid md:grid-cols-3 gap-4 md:gap-5 relative" data-reveal="120">
          <span className="hidden md:block absolute top-[38px] left-[16%] right-[16%] h-px bg-[linear-gradient(90deg,transparent,var(--s-line-2)_15%,var(--s-line-2)_85%,transparent)]" aria-hidden />
          {steps.map(({ i: Icon, t, b, k }, idx) => (
            <li key={t} className="relative s-card p-6 md:p-7 text-center md:text-left bg-[var(--s-bg)]">
              <div className="flex md:block flex-col items-center">
                <span className="relative w-12 h-12 rounded-2xl bg-white border border-[var(--s-line)] shadow-[var(--s-shadow-sm)] inline-flex items-center justify-center text-[var(--s-brand)]">
                  <Icon size={20} />
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--s-ink)] text-white text-[10.5px] font-semibold inline-flex items-center justify-center tabular-nums">
                    {idx + 1}
                  </span>
                </span>
              </div>
              <h3 className="s-h3 mt-5">{t}</h3>
              <p className="s-body mt-2">{b}</p>
              <span className="mt-5 inline-flex s-kbd !h-7 !px-2.5 !text-[11.5px]">{k}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── FAQ ────────────────────────────────────────────────────────────────── */
const faqs = [
  {
    q: "Where are my notes actually stored?",
    a: "In your browser's IndexedDB, on the device you're using. They are never uploaded to a MindVault server. You can export everything at any time as a ZIP, a PDF or a full JSON backup.",
  },
  {
    q: "Does the assistant send my notes to an AI provider?",
    a: "Only when you ask it a question, and only the notes needed to answer — nothing is stored server-side. Without an API key, the assistant runs fully locally. The public demo on this page always runs locally.",
  },
  {
    q: "Can I use it on my iPhone?",
    a: "Yes. Open the site in Safari, tap Share → Add to Home Screen, and MindVault becomes an app: full screen, offline-ready, with push reminders for your dated notes.",
  },
  {
    q: "What happens if I clear my browser data?",
    a: "Your vault lives in the browser, so clearing site data erases it. That's why the Export page offers a one-click full backup you can restore on any device.",
  },
  {
    q: "Is there a demo account?",
    a: "Yes — the sign-in page shows demo credentials and fills them in for you with one click. The vault then starts empty and private to your browser, ready for your own notes.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="s-section s-anchor">
      <div className="s-container grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-20">
        <div data-reveal>
          <p className="s-eyebrow">FAQ</p>
          <h2 className="s-h2 mt-4">Questions, answered.</h2>
          <p className="s-lead mt-5 max-w-sm">The short version: your notes are yours, they stay with you, and you can leave with them whenever you want.</p>
        </div>
        <div className="border-t border-[var(--s-line)]" data-reveal="120">
          {faqs.map((f, i) => (
            <details key={f.q} className="s-faq group border-b border-[var(--s-line)]" open={i === 0}>
              <summary className="flex items-center justify-between gap-6 py-5 md:py-6 text-[15.5px] md:text-[16.5px] font-medium tracking-[-0.012em] text-[var(--s-ink)]">
                {f.q}
                <span className="s-faq-icon w-8 h-8 rounded-full border border-[var(--s-line-2)] inline-flex items-center justify-center shrink-0 text-[var(--s-muted)]">
                  <Plus size={15} />
                </span>
              </summary>
              <p className="pb-6 -mt-1 pr-12 s-body max-w-2xl">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ──────────────────────────────────────────────────────────── */
export function FinalCta() {
  return (
    <section className="pb-[clamp(84px,11vw,144px)]">
      <div className="s-container">
        <div
          className="relative overflow-hidden rounded-[28px] border border-[var(--s-brand-line)] px-6 py-16 md:py-24 text-center bg-[linear-gradient(160deg,#f1efff_0%,#eaf6fc_55%,#e9f7f0_100%)]"
          data-reveal
        >
          <div className="absolute inset-0 s-grid-bg opacity-70" aria-hidden />
          <div className="s-aura w-[420px] h-[300px] -bottom-32 left-1/2 -translate-x-1/2 bg-[#c9c1ff] opacity-60" aria-hidden />
          <div className="relative">
            <h2 className="s-h2 max-w-[18ch] mx-auto">
              Give your thoughts a <span className="s-serif s-grad-text">home.</span>
            </h2>
            <p className="s-lead mt-5 max-w-md mx-auto">Private by default, fast by design. Open the vault and start writing in seconds.</p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center max-w-sm sm:max-w-none mx-auto">
              <Link href="/login" className="s-btn s-btn-primary s-btn-lg">
                Open your vault <ArrowRight size={17} className="s-arrow" />
              </Link>
              <a href="#demo" onClick={(e) => scrollToHash(e, "#demo")} className="s-btn s-btn-secondary s-btn-lg">
                Try the live demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
