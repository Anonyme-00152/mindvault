"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Wordmark } from "./Brand";
import { cn } from "@/lib/utils";

const links = [
  { href: "#features", label: "Features" },
  { href: "#demo", label: "Live demo" },
  { href: "#privacy", label: "Privacy" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export function scrollToHash(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith("#")) return;
  const lenis = (window as unknown as { lenis?: { scrollTo: (t: string, o?: object) => void } }).lenis;
  if (lenis) {
    e.preventDefault();
    lenis.scrollTo(href, { offset: -72, duration: 1.2 });
    history.replaceState(null, "", href);
  }
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const lenis = (window as unknown as { lenis?: { stop: () => void; start: () => void } }).lenis;
    if (open) lenis?.stop();
    else lenis?.start();
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-[background,box-shadow,border-color] duration-300 border-b",
        scrolled || open
          ? "bg-[rgba(251,251,250,0.82)] backdrop-blur-xl backdrop-saturate-150 border-[var(--s-line)]"
          : "bg-transparent border-transparent",
      )}
      style={{ paddingTop: "var(--sat)" }}
    >
      <div className="s-container flex items-center justify-between h-16">
        <Link href="/" aria-label="MindVault home" className="rounded-lg">
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => scrollToHash(e, l.href)}
              className="px-3.5 h-9 inline-flex items-center rounded-lg text-[14px] text-[var(--s-muted)] hover:text-[var(--s-ink)] hover:bg-black/[0.04] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="s-btn s-btn-ghost s-btn-sm hidden sm:inline-flex">
            Sign in
          </Link>
          <Link href="/login" className="s-btn s-btn-primary s-btn-sm hidden sm:inline-flex">
            Open the vault <ArrowRight size={15} className="s-arrow" />
          </Link>
          <button
            type="button"
            className="lg:hidden w-10 h-10 inline-flex items-center justify-center rounded-xl text-[var(--s-ink)] hover:bg-black/5"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        id="mobile-menu"
        className={cn(
          "lg:hidden overflow-hidden transition-[max-height,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
          open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0 pointer-events-none",
        )}
      >
        <div className="s-container pb-6 pt-2">
          <nav aria-label="Mobile" className="flex flex-col">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => {
                  setOpen(false);
                  scrollToHash(e, l.href);
                }}
                className="h-12 flex items-center justify-between border-b border-[var(--s-line)] text-[16px] font-medium text-[var(--s-ink)]"
              >
                {l.label}
                <ArrowRight size={16} className="text-[var(--s-faint)]" />
              </a>
            ))}
          </nav>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <Link href="/login" className="s-btn s-btn-secondary">
              Sign in
            </Link>
            <Link href="/login" className="s-btn s-btn-primary">
              Open the vault
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
