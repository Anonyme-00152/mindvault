import Link from "next/link";
import { Wordmark } from "./Brand";

const cols = [
  {
    t: "Product",
    l: [
      ["Features", "#features"],
      ["Live demo", "#demo"],
      ["How it works", "#how"],
      ["Sign in", "/login"],
    ],
  },
  {
    t: "Trust",
    l: [
      ["Privacy", "#privacy"],
      ["Security", "#privacy"],
      ["FAQ", "#faq"],
    ],
  },
  {
    t: "Built with",
    l: [
      ["Next.js 15 · React 19", ""],
      ["IndexedDB · Dexie", ""],
      ["GSAP · Tailwind v4", ""],
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--s-line)] bg-white" style={{ paddingBottom: "var(--sab)" }}>
      <div className="s-container py-14 md:py-16">
        <div className="grid md:grid-cols-[1.4fr_repeat(3,1fr)] gap-10">
          <div>
            <Wordmark />
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--s-muted)] max-w-[30ch]">
              A private, local-first vault for notes, tasks and files.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 h-8 px-3 rounded-full border border-[var(--s-line)] text-[12.5px] text-[var(--s-ink-2)]">
              <span className="w-2 h-2 rounded-full bg-[var(--s-mint)]" /> All systems normal
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.t}>
              <p className="text-[12.5px] font-semibold text-[var(--s-ink)]">{c.t}</p>
              <ul className="mt-4 space-y-2.5">
                {c.l.map(([label, href]) => (
                  <li key={label} className="text-[14px] text-[var(--s-muted)]">
                    {href ? (
                      <Link href={href} className="hover:text-[var(--s-ink)] transition-colors">
                        {label}
                      </Link>
                    ) : (
                      label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-6 border-t border-[var(--s-line)] flex flex-col sm:flex-row justify-between gap-3 text-[12.5px] text-[var(--s-faint)]">
          <p>© {new Date().getFullYear()} MindVault. A portfolio project — design &amp; engineering.</p>
          <p>Made with care in Paris.</p>
        </div>
      </div>
    </footer>
  );
}
