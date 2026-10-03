"use client";

import { useEffect } from "react";

/**
 * Turns on scroll reveals for every `[data-reveal]` inside `.site`.
 * Progressive: without JS nothing is hidden; with JS, elements fade up as they
 * enter the viewport. A `data-reveal="<ms>"` value staggers the delay.
 */
export function RevealRoot() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".site");
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (reduced || !("IntersectionObserver" in window)) return;

    // Elements already on screen at load reveal straight away (no flash: they start at opacity 0
    // only for the frame it takes to add the class, and the transition covers it).
    els.forEach((el) => {
      const d = el.dataset.reveal;
      if (d) el.style.setProperty("--d", `${d}ms`);
    });
    root.classList.add("s-js");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    requestAnimationFrame(() => els.forEach((el) => io.observe(el)));
    return () => io.disconnect();
  }, []);
  return null;
}
