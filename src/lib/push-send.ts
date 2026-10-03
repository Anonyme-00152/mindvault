import type { Device } from "./push-store";
import { getPushStore } from "./push-store";
import { dueReminders } from "./reminders";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export type Sender = (device: Device, payload: PushPayload) => Promise<{ ok: true } | { ok: false; gone: boolean; error: string }>;

export function vapidConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/** Real sender: web-push with VAPID. Loaded lazily so tests can inject a fake. */
export const webPushSender: Sender = async (device, payload) => {
  const { default: webpush } = await import("web-push");
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  try {
    await webpush.sendNotification(device.subscription, JSON.stringify(payload), { TTL: 60 * 60, urgency: "high" });
    return { ok: true };
  } catch (e) {
    const err = e as { statusCode?: number; body?: string; message: string };
    const status = err.statusCode;
    // 404/410 mean the subscription no longer exists. A brand-new FCM token can
    // briefly answer 410 too, so a device younger than 2 minutes is never dropped.
    const fresh = Date.now() - new Date(device.createdAt).getTime() < 2 * 60_000;
    return { ok: false, gone: (status === 404 || status === 410) && !fresh, error: `${status ?? "?"} ${(err.body || err.message || "").toString().trim().slice(0, 160)}` };
  }
};

/**
 * One scheduler pass: for every device, send the reminders that are due and
 * haven't been sent. Devices whose subscription is gone are removed.
 */
export async function tick(now = Date.now(), send: Sender = webPushSender) {
  const store = getPushStore();
  const devices = await store.all();
  const report = { devices: devices.length, sent: 0, failed: 0, removed: 0 };
  for (const d of devices) {
    const due = dueReminders(d.reminders, now, 15 * 60_000).filter((r) => !d.sent.includes(`${r.id}@${r.at}`));
    if (due.length === 0) continue;
    let changed = false;
    for (const r of due) {
      const res = await send(d, { title: r.title, body: r.body, url: r.url, tag: r.id });
      if (res.ok) {
        d.sent.push(`${r.id}@${r.at}`);
        report.sent++;
        changed = true;
      } else {
        report.failed++;
        if (res.gone) {
          await store.delete(d.id);
          report.removed++;
          changed = false;
          break;
        }
      }
    }
    if (changed) {
      d.sent = d.sent.slice(-200);
      // reminders in the past are no longer needed
      d.reminders = d.reminders.filter((r) => r.at > now - 15 * 60_000);
      d.updatedAt = new Date(now).toISOString();
      await store.put(d);
    }
  }
  return report;
}
