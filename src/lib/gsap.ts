"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

// GSAP 3.13+ ships every plugin free of charge. Register once.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, DrawSVGPlugin, CustomEase, useGSAP);
  if (!CustomEase.get("vault")) {
    CustomEase.create("vault", "M0,0 C0.22,1 0.36,1 1,1");
  }
  gsap.defaults({ ease: "vault", duration: 1 });
  // Keep animations time-accurate even when a WebGL frame takes long (weak GPUs):
  // the default lag smoothing would otherwise stretch every timeline.
  gsap.ticker.lagSmoothing(0);
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, SplitText, Flip, DrawSVGPlugin, CustomEase, useGSAP };
