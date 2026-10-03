"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { Wordmark } from "@/components/site/Brand";

export function LoginScreen({ demo }: { demo: { user: string; password: string } | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const pwRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [shake, setShake] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || ok) return;
    if (!user.trim() || !password) {
      setError("Enter your identifier and password.");
      setShake((s) => s + 1);
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "That identifier and password don't match.");
        setShake((s) => s + 1);
        setBusy(false);
        pwRef.current?.select();
        return;
      }
      setOk(true);
      const next = params.get("next");
      // Only follow same-site relative paths.
      const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
      router.prefetch(dest);
      window.setTimeout(() => router.push(dest), 650);
    } catch {
      setError("Can't reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  const fillDemo = () => {
    if (!demo) return;
    setUser(demo.user);
    setPassword(demo.password);
    setError("");
  };

  return (
    <div className="site grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ── Form column ─────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col min-h-[100dvh] bg-[var(--s-bg)] px-5 sm:px-10 lg:px-14 xl:px-20"
        style={{ paddingTop: "calc(1.25rem + var(--sat))", paddingBottom: "calc(1.25rem + var(--sab))" }}
      >
        <header className="flex items-center justify-between h-12">
          <Link href="/" aria-label="MindVault home">
            <Wordmark />
          </Link>
          <Link href="/" className="s-btn s-btn-ghost s-btn-sm !px-3 !text-[var(--s-muted)]">
            <ArrowLeft size={15} /> Back to site
          </Link>
        </header>

        <main className="flex-1 flex items-center py-10 sm:py-12">
          <div className="w-full max-w-[400px] mx-auto login-rise">
            <span className="w-12 h-12 rounded-2xl bg-white border border-[var(--s-line)] shadow-[var(--s-shadow)] inline-flex items-center justify-center text-[var(--s-brand)]">
              <Lock size={19} />
            </span>
            <h1 className="mt-7 text-[32px] sm:text-[36px] font-semibold tracking-[-0.04em] leading-[1.08]">Welcome back</h1>
            <p className="mt-2.5 text-[15.5px] text-[var(--s-muted)]">Sign in to open your vault.</p>

            {demo && (
              <div className="mt-8 rounded-2xl border border-[var(--s-brand-line)] bg-[var(--s-brand-soft)] p-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-white text-[var(--s-brand)] inline-flex items-center justify-center shrink-0 shadow-[var(--s-shadow-sm)]">
                    <Sparkles size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-[var(--s-ink)]">Demo account</p>
                    <p className="mt-0.5 text-[12.5px] text-[var(--s-ink-2)] leading-relaxed break-words">
                      <span className="s-mono">{demo.user}</span>
                      <span className="text-[var(--s-faint)]"> · </span>
                      <span className="s-mono">{demo.password}</span>
                    </p>
                  </div>
                  <button type="button" onClick={fillDemo} className="s-btn s-btn-secondary !h-8 !px-3 !text-[12.5px] !rounded-lg shrink-0">
                    <Wand2 size={13} /> Fill in
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={submit} className="mt-7 space-y-5" noValidate aria-busy={busy}>
              <div>
                <label htmlFor="user" className="s-label">
                  Identifier
                </label>
                <input
                  id="user"
                  className="s-field"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="Your identifier"
                  required
                  disabled={ok}
                  aria-invalid={!!error}
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>
              <div>
                <label htmlFor="password" className="s-label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    ref={pwRef}
                    className="s-field !pr-12"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={ok}
                    aria-invalid={!!error}
                    aria-describedby={error ? "login-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg inline-flex items-center justify-center text-[var(--s-faint)] hover:text-[var(--s-ink)] hover:bg-[var(--s-subtle)] transition-colors"
                    aria-label={show ? "Hide password" : "Show password"}
                    aria-pressed={show}
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div aria-live="polite">
                {error && (
                  <p
                    key={shake}
                    id="login-error"
                    className="login-shake flex items-start gap-2 rounded-xl border border-[#f4ddb0] bg-[#fff8ea] px-3.5 py-3 text-[13.5px] text-[#8a5300]"
                  >
                    <AlertCircle size={16} className="shrink-0 mt-px" /> {error}
                  </p>
                )}
              </div>

              <button className={"s-btn s-btn-lg w-full " + (ok ? "s-btn-brand" : "s-btn-primary")} disabled={busy && !ok}>
                {ok ? (
                  <>
                    <Check size={18} strokeWidth={2.5} /> Vault unlocked
                  </>
                ) : busy ? (
                  <>
                    <span className="spinner !border-white/25 !border-t-white" /> Signing in…
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight size={17} className="s-arrow" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-[13px] text-[var(--s-faint)]">
              New here?{" "}
              <Link
                href="/#demo"
                className="font-medium text-[var(--s-ink-2)] underline underline-offset-4 decoration-[var(--s-line-2)] hover:decoration-[var(--s-ink)]"
              >
                Try the live demo first
              </Link>
            </p>
          </div>
        </main>

        <footer className="flex items-center justify-center lg:justify-start gap-2 text-[12.5px] text-[var(--s-faint)]">
          <ShieldCheck size={14} className="text-[var(--s-mint)]" />
          Signed, httpOnly session · expires after 7 days
        </footer>
      </div>

      {/* ── Brand panel ─────────────────────────────────────────────── */}
      <aside className="relative hidden lg:flex flex-col justify-between min-h-[100dvh] overflow-hidden border-l border-[var(--s-line)] bg-[linear-gradient(155deg,#f1efff_0%,#eaf5fc_55%,#e8f6ef_100%)] p-12 xl:p-16">
        <div className="absolute inset-0 s-grid-bg opacity-80" aria-hidden />
        <div className="s-aura w-[420px] h-[360px] top-[18%] left-[12%] bg-[#cfc7ff] opacity-60" aria-hidden />
        <div className="s-aura w-[380px] h-[320px] bottom-[10%] right-[6%] bg-[#bfe9f8] opacity-60" aria-hidden />

        <div className="relative max-w-md">
          <p className="s-eyebrow">Local-first · Private by default</p>
          <h2 className="mt-4 text-[38px] xl:text-[44px] font-semibold tracking-[-0.04em] leading-[1.04]">
            Your notes never <span className="s-serif s-grad-text">leave this device.</span>
          </h2>
        </div>

        {/* Floating product cards */}
        <div className="relative h-[340px] xl:h-[380px] my-8" aria-hidden>
          <div className="absolute left-0 top-8 w-[78%] max-w-[380px] -rotate-[2deg]">
            <div className="rounded-2xl bg-white border border-[var(--s-line)] shadow-[var(--s-shadow-lg)] p-5 s-float">
              <div className="flex items-center justify-between mb-3">
                <span className="s-chip" data-p="high">
                  high
                </span>
                <span className="text-[11px] s-mono text-[var(--s-faint)]">Today · 14:00</span>
              </div>
              <p className="text-[15px] font-semibold tracking-[-0.015em]">Portfolio case study — MindVault</p>
              <ul className="mt-3 space-y-2 text-[13px]">
                {(
                  [
                    ["Record the vault-opening sequence", true],
                    ["Write the “why” paragraph", false],
                    ["Export OG image 1200×630", false],
                  ] as const
                ).map(([t, on]) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span className="s-check" data-on={on}>
                      {on && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className={on ? "line-through text-[var(--s-faint)]" : "text-[var(--s-ink-2)]"}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 w-[72%] max-w-[340px] rotate-[1.5deg]">
            <div className="rounded-2xl bg-white border border-[var(--s-line)] shadow-[var(--s-shadow-lg)] p-4 s-float" style={{ animationDelay: "-3s" }}>
              <p className="inline-flex items-center gap-2 text-[12.5px] font-semibold">
                <span className="w-6 h-6 rounded-lg bg-[var(--s-brand-soft)] text-[var(--s-brand)] inline-flex items-center justify-center">
                  <Sparkles size={13} />
                </span>
                Vault assistant
              </p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--s-ink-2)]">
                Two things today. Start with <strong className="text-[var(--s-ink)]">Portfolio case study</strong> at 14:00 —
                two tasks are still open.
              </p>
            </div>
          </div>

          <div className="absolute right-[6%] top-0 inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-white/90 border border-[var(--s-line)] shadow-[var(--s-shadow)] text-[12.5px] font-medium text-[var(--s-ink-2)]">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-[var(--s-mint)] s-ping" />
              <span className="relative w-2 h-2 rounded-full bg-[var(--s-mint)]" />
            </span>
            Stored on this device
          </div>
        </div>

        <ul className="relative grid grid-cols-3 gap-6 max-w-lg">
          {[
            ["IndexedDB", "Notes & files live in your browser"],
            ["Offline", "Keeps working without a network"],
            ["Exportable", "ZIP, PDF or full backup"],
          ].map(([t, d]) => (
            <li key={t}>
              <p className="text-[13.5px] font-semibold">{t}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-[var(--s-muted)]">{d}</p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
