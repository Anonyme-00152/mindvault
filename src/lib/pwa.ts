"use client";

import type { Note } from "./types";
import { remindersFor, dueReminders, DEFAULT_LEAD_MIN, type Reminder } from "./reminders";

/* ── Environment detection ────────────────────────────────────────────── */
export function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function shareSupported() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function badgeSupported() {
  return typeof navigator !== "undefined" && "setAppBadge" in navigator;
}

/** iOS only delivers Web Push to installed (Home Screen) web apps. */
export function pushBlockedByIOS() {
  return isIOS() && !isStandalone();
}

/* ── Service worker ───────────────────────────────────────────────────── */
let regPromise: Promise<ServiceWorkerRegistration | null> | null = null;
export function registerSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return Promise.resolve(null);
  if (!regPromise) {
    regPromise = navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((r) => r)
      .catch(() => null);
  }
  return regPromise;
}

/* ── Push subscription ────────────────────────────────────────────────── */
function b64ToUint8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function serverPushInfo(): Promise<{ enabled: boolean; publicKey: string }> {
  try {
    const r = await fetch("/api/push/vapid", { cache: "no-store" });
    return await r.json();
  } catch {
    return { enabled: false, publicKey: "" };
  }
}

export async function currentSubscription() {
  const reg = await registerSW();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

export type EnableResult = { ok: true; endpoint: string } | { ok: false; reason: string };

export async function enablePush(leadMin = DEFAULT_LEAD_MIN): Promise<EnableResult> {
  if (!pushSupported()) return { ok: false, reason: "This browser does not support push notifications." };
  if (pushBlockedByIOS()) return { ok: false, reason: "On iPhone, add MindVault to your Home Screen first (Share → Add to Home Screen), then enable notifications from the installed app." };
  const info = await serverPushInfo();
  if (!info.enabled) return { ok: false, reason: "Push is not configured on the server (VAPID keys)." };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "Notification permission was not granted." };
  const reg = await registerSW();
  if (!reg) return { ok: false, reason: "Service worker unavailable." };
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(info.publicKey) as BufferSource });
    } catch (e) {
      const msg = (e as Error).message || "";
      return { ok: false, reason: /incognito|private/i.test(msg) ? "Push is not available in private/incognito windows." : `The browser could not subscribe: ${msg || "unknown error"}.` };
    }
  }
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), leadMin }),
  });
  if (!res.ok) return { ok: false, reason: `Server refused the subscription (${res.status}).` };
  try {
    localStorage.setItem("mv-push", "1");
  } catch {}
  return { ok: true, endpoint: sub.endpoint };
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (sub) {
    await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => undefined);
    await sub.unsubscribe().catch(() => undefined);
  }
  try {
    localStorage.removeItem("mv-push");
  } catch {}
}

export function pushWanted() {
  try {
    return localStorage.getItem("mv-push") === "1";
  } catch {
    return false;
  }
}

export function getLeadMin() {
  try {
    const v = Number(localStorage.getItem("mv-lead"));
    return Number.isFinite(v) && v >= 0 ? v : DEFAULT_LEAD_MIN;
  } catch {
    return DEFAULT_LEAD_MIN;
  }
}
export function setLeadMin(v: number) {
  try {
    localStorage.setItem("mv-lead", String(v));
  } catch {}
}

/** Push the current reminder set to the server for this browser. */
export async function syncReminders(notes: Note[]) {
  if (!pushWanted()) return;
  const sub = await currentSubscription();
  if (!sub) return;
  const leadMin = getLeadMin();
  await fetch("/api/push/reminders", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint, leadMin, reminders: remindersFor(notes, leadMin) }),
  }).catch(() => undefined);
}

/* ── Local notifications (app open) ──────────────────────────────────── */
export async function showLocalNotification(r: Pick<Reminder, "title" | "body" | "url"> & { tag?: string }) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  const reg = await registerSW();
  if (reg?.active) {
    reg.active.postMessage({ type: "notify", ...r });
    return true;
  }
  try {
    new Notification(r.title, { body: r.body });
    return true;
  } catch {
    return false;
  }
}

const firedKey = "mv-fired";
function firedSet(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(firedKey) || "[]"));
  } catch {
    return new Set();
  }
}

/**
 * While the app is open, fire due reminders locally (no server needed) and nudge
 * the server scheduler so closed-app devices get their push too.
 */
export async function runLocalScheduler(notes: Note[]) {
  const now = Date.now();
  const due = dueReminders(remindersFor(notes, getLeadMin(), now - 60 * 60_000), now, 2 * 60_000);
  const fired = firedSet();
  for (const r of due) {
    const k = `${r.id}@${r.at}`;
    if (fired.has(k)) continue;
    if (await showLocalNotification({ ...r, tag: r.id })) {
      fired.add(k);
    }
  }
  try {
    sessionStorage.setItem(firedKey, JSON.stringify([...fired].slice(-100)));
  } catch {}
  if (pushWanted()) fetch("/api/push/tick", { method: "POST" }).catch(() => undefined);
}

/* ── Badge ────────────────────────────────────────────────────────────── */
export async function setBadge(n: number) {
  if (!badgeSupported()) return;
  const nav = navigator as unknown as { setAppBadge: (n?: number) => Promise<void>; clearAppBadge: () => Promise<void> };
  try {
    if (n > 0) await nav.setAppBadge(n);
    else await nav.clearAppBadge();
  } catch {}
}

/* ── Share ────────────────────────────────────────────────────────────── */
export async function shareNote(note: Note) {
  const text = [note.content, ...note.checklist.map((c) => `${c.done ? "☑" : "☐"} ${c.text}`)].filter(Boolean).join("\n");
  if (shareSupported()) {
    try {
      await navigator.share({ title: note.title || "Untitled", text: `${note.title || "Untitled"}\n\n${text}`.trim() });
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(`${note.title || "Untitled"}\n\n${text}`.trim());
    return "copied";
  } catch {
    return "failed";
  }
}

/* ── Storage ──────────────────────────────────────────────────────────── */
export async function storageInfo() {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  const est = await navigator.storage.estimate();
  let persisted: boolean | null = null;
  try {
    persisted = (await navigator.storage.persisted?.()) ?? null;
  } catch {}
  return { usage: est.usage ?? 0, quota: est.quota ?? 0, persisted };
}
export async function requestPersistentStorage() {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
