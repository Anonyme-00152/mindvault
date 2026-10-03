"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionState } from "@/lib/store";

/**
 * Custom cursor with lerped follow (gsap.quickTo), blend-mode difference and
 * contextual states driven by data-cursor attributes:
 *   data-cursor="hover"  → larger ring
 *   data-cursor="text"   → filled disc with a label (data-cursor-label)
 *   data-cursor="hidden" → hides the ring (e.g. over WebGL canvases)
 * Disabled automatically on touch devices.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const d = dot.current!;
    const r = ring.current!;
    document.body.classList.add("has-cursor");

    const dx = gsap.quickTo(d, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(d, "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(r, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.45, ease: "power3" });

    let shown = false;
    const move = (e: PointerEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      motionState.px = (e.clientX / window.innerWidth) * 2 - 1;
      motionState.py = -((e.clientY / window.innerHeight) * 2 - 1);
      if (!shown) {
        shown = true;
        gsap.to([d, r], { opacity: 1, duration: 0.4 });
      }
    };

    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement)?.closest?.("[data-cursor], a, button, input, textarea, select, label, [role=button]") as HTMLElement | null;
      if (!t) {
        r.dataset.state = "";
        if (label.current) label.current.textContent = "";
        return;
      }
      const state = t.dataset.cursor ?? (t.matches("input, textarea, select") ? "hidden" : "hover");
      r.dataset.state = state;
      if (label.current) label.current.textContent = state === "text" ? (t.dataset.cursorLabel ?? "Open") : "";
    };

    const leave = () => gsap.to([d, r], { opacity: 0, duration: 0.3 });
    const enter = () => gsap.to([d, r], { opacity: 1, duration: 0.3 });

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    document.documentElement.addEventListener("mouseenter", enter);
    return () => {
      document.body.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.documentElement.removeEventListener("mouseenter", enter);
    };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor cursor-dot" style={{ opacity: 0 }} aria-hidden />
      <div ref={ring} className="cursor cursor-ring" style={{ opacity: 0 }} aria-hidden>
        <span ref={label} />
      </div>
    </>
  );
}
