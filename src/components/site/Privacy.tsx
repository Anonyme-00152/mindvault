import { Database, FileLock2, KeyRound, Laptop, Lock, Server, ShieldCheck, Sparkles, Timer } from "lucide-react";

const device = ["Notes & checklists", "Files & attachments", "Conversations", "Search index"];
const server = ["Signed session cookie", "Your API key (never sent to you)"];

const facts = [
  {
    i: Database,
    t: "Local-first by design",
    b: "Notes and files live in your browser's IndexedDB. No account, no sync, no telemetry.",
  },
  {
    i: KeyRound,
    t: "Secrets stay server-side",
    b: "Credentials and the AI key exist only on the server. The code you download contains none.",
  },
  {
    i: Timer,
    t: "Short, signed sessions",
    b: "HMAC-signed, httpOnly cookies that expire after 7 days. Brute-force attempts are throttled.",
  },
  {
    i: FileLock2,
    t: "Hardened headers",
    b: "Framing denied, MIME sniffing off, strict referrer and permission policies on every response.",
  },
];

export function Privacy() {
  return (
    <section id="privacy" className="s-section s-anchor relative">
      <div className="s-container">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-center">
          <div data-reveal>
            <p className="s-eyebrow">Privacy</p>
            <h2 className="s-h2 mt-4 lg:!text-[2.9rem]">
              Nothing leaves your device.
              <span className="text-[var(--s-faint)]"> Not a note, not a file, not a keystroke.</span>
            </h2>
            <p className="s-lead mt-5 max-w-lg">
              MindVault isn&apos;t a cloud with a privacy policy. It&apos;s software that runs where you are — the server
              only checks who you are.
            </p>
          </div>

          {/* Where your data lives */}
          <div data-reveal="120" className="s-card p-5 md:p-7 relative overflow-hidden">
            <div className="absolute inset-0 s-dots-bg opacity-40" aria-hidden />
            <div className="relative grid sm:grid-cols-[1.25fr_auto_1fr] gap-4 sm:gap-3 items-stretch">
              <div className="rounded-2xl border-2 border-[var(--s-brand)] bg-white p-4 md:p-5 shadow-[0_12px_32px_-14px_rgba(91,75,255,0.45)]">
                <div className="flex items-center justify-between">
                  <p className="inline-flex items-center gap-2 text-[13.5px] font-semibold">
                    <Laptop size={16} className="text-[var(--s-brand)]" /> Your device
                  </p>
                  <span className="s-chip no-dot !normal-case !bg-[var(--s-brand-soft)] !text-[var(--s-brand-ink)] !border-[var(--s-brand-line)]">
                    Everything
                  </span>
                </div>
                <ul className="mt-4 space-y-2">
                  {device.map((d) => (
                    <li key={d} className="flex items-center gap-2.5 h-9 px-3 rounded-lg bg-[var(--s-subtle)] text-[13px] text-[var(--s-ink-2)]">
                      <Lock size={13} className="text-[var(--s-mint)]" /> {d}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex sm:flex-col items-center justify-center gap-2 text-[11px] text-[var(--s-faint)] s-mono" aria-hidden>
                <span className="h-px w-10 sm:w-px sm:h-10 bg-[var(--s-line-2)]" />
                <ShieldCheck size={16} className="text-[var(--s-mint)]" />
                <span className="h-px w-10 sm:w-px sm:h-10 bg-[var(--s-line-2)]" />
              </div>

              <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-[var(--s-line)] bg-white p-4">
                  <p className="inline-flex items-center gap-2 text-[13.5px] font-semibold">
                    <Server size={16} className="text-[var(--s-muted)]" /> Server
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {server.map((d) => (
                      <li key={d} className="text-[12.5px] text-[var(--s-muted)] leading-snug flex gap-2">
                        <span className="mt-[7px] w-1 h-1 rounded-full bg-[var(--s-faint)] shrink-0" /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-dashed border-[var(--s-line-2)] bg-white/60 p-4">
                  <p className="inline-flex items-center gap-2 text-[13.5px] font-semibold">
                    <Sparkles size={15} className="text-[var(--s-sky)]" /> Assistant
                  </p>
                  <p className="mt-2 text-[12.5px] text-[var(--s-muted)] leading-snug">
                    Reads your notes only at the moment you ask — never stored. Runs fully offline without a key.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 md:mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-[var(--s-line)] bg-[var(--s-line)]" data-reveal>
          {facts.map(({ i: Icon, t, b }) => (
            <div key={t} className="bg-[var(--s-bg)] p-6">
              <Icon size={18} className="text-[var(--s-brand)]" />
              <p className="mt-4 text-[14.5px] font-semibold tracking-[-0.01em]">{t}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--s-muted)]">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
