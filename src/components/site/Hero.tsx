"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, Check, Play } from "lucide-react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { ProductWindow } from "./ProductWindow";
import { scrollToHash } from "./Nav";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // The product shot settles flat as you scroll into it.
      gsap.fromTo(
        ".h-tilt",
        { rotateX: 9, scale: 0.96 },
        {
          rotateX: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: ".h-shot", start: "top 85%", end: "top 20%", scrub: 0.6 },
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="relative overflow-hidden pt-[calc(7.5rem+var(--sat))] md:pt-[calc(9.5rem+var(--sat))] pb-16 md:pb-24">
      {/* Backdrop: hairline grid + two soft auras */}
      <div className="absolute inset-0 s-grid-bg pointer-events-none" aria-hidden />
      <div className="s-aura w-[520px] h-[420px] -top-40 left-[8%] bg-[#d9d3ff] opacity-70" aria-hidden />
      <div className="s-aura w-[520px] h-[420px] -top-24 right-[4%] bg-[#cdeefb] opacity-70" aria-hidden />

      <div className="s-container relative text-center">
        <a href="#demo" onClick={(e) => scrollToHash(e, "#demo")} className="h-in s-badge hover:border-[var(--s-line-2)] transition-colors">
          <span className="s-badge-pill">New</span>
          Ask your notes anything — try it live
          <ArrowRight size={14} className="text-[var(--s-faint)]" />
        </a>

        <h1 className="h-in s-h1 mt-7 md:mt-8 mx-auto max-w-[14ch]">
          Your mind, <span className="s-serif s-grad-text">vaulted.</span>
        </h1>

        <p className="h-in s-lead mt-6 mx-auto max-w-[36rem]">
          Notes, tasks, calendar and files in one calm workspace — with an assistant that only knows what you tell it.
          Everything stays on your device.
        </p>

        <div className="h-in mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-sm sm:max-w-none mx-auto">
          <Link href="/login" className="s-btn s-btn-primary s-btn-lg">
            Open your vault <ArrowRight size={17} className="s-arrow" />
          </Link>
          <a href="#demo" onClick={(e) => scrollToHash(e, "#demo")} className="s-btn s-btn-secondary s-btn-lg">
            <Play size={15} className="fill-current" /> Try the live demo
          </a>
        </div>

        <ul className="h-in mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13.5px] text-[var(--s-muted)]">
          {["No account to create", "Works offline", "Installs on iPhone"].map((t) => (
            <li key={t} className="inline-flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#e7f6ef] text-[var(--s-mint)] inline-flex items-center justify-center">
                <Check size={10} strokeWidth={3.5} />
              </span>
              {t}
            </li>
          ))}
        </ul>

        <div id="product" className="h-shot relative mt-14 md:mt-20 mx-auto max-w-[1120px]" style={{ perspective: 1600 }}>
          <div className="h-tilt origin-top will-change-transform" style={{ transformStyle: "preserve-3d" }}>
            <ProductWindow />
          </div>
          {/* Floor reflection */}
          <div className="absolute -bottom-10 inset-x-[10%] h-24 bg-[radial-gradient(ellipse_at_center,rgba(91,75,255,0.18),transparent_70%)] blur-2xl -z-10" aria-hidden />
        </div>
      </div>
    </section>
  );
}
