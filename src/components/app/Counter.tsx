"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/** Animates to `value` whenever it changes; re-renders never reset it. */
export function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { v: shown.current };
    const tween = gsap.to(obj, {
      v: value,
      duration: 1.1,
      ease: "power3.out",
      onUpdate: () => {
        shown.current = obj.v;
        el.textContent = `${Math.round(obj.v)}${suffix}`;
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, suffix]);
  return <span ref={ref}>{`${Math.round(shown.current)}${suffix}`}</span>;
}
