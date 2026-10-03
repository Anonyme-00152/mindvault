"use client";

/**
 * "Intro finished" signal shared by the preloader, nav and hero. Unlike a bare
 * DOM event it remembers its state, so a listener registered late still fires.
 */
let ready = false;
const listeners = new Set<() => void>();

export function markReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((l) => l());
  listeners.clear();
}

export function onReady(cb: () => void) {
  if (ready) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function isReady() {
  return ready;
}
