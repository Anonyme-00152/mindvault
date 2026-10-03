import { NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/session-server";
import { deviceId, getPushStore } from "@/lib/push-store";
import type { Reminder } from "@/lib/reminders";

export const runtime = "nodejs";

const MAX = 500;

function validReminder(r: unknown): r is Reminder {
  const x = r as Reminder;
  return Boolean(x && typeof x.id === "string" && typeof x.title === "string" && typeof x.at === "number" && Number.isFinite(x.at) && typeof x.url === "string" && x.url.startsWith("/"));
}

/** Replace the reminder set of this browser (the client is the source of truth). */
export async function PUT(req: Request) {
  const session = await sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { endpoint?: string; reminders?: unknown[]; leadMin?: number };
  if (!body.endpoint || !Array.isArray(body.reminders)) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const store = getPushStore();
  const id = await deviceId(body.endpoint);
  const d = await store.get(id);
  if (!d || d.user !== session.user) return NextResponse.json({ error: "Unknown device" }, { status: 404 });

  d.reminders = body.reminders
    .filter(validReminder)
    .slice(0, MAX)
    .map((r) => ({ id: r.id.slice(0, 64), title: r.title.slice(0, 120), body: String(r.body ?? "").slice(0, 200), at: r.at, url: r.url.slice(0, 300) }));
  if (typeof body.leadMin === "number") d.leadMin = body.leadMin;
  d.updatedAt = new Date().toISOString();
  await store.put(d);
  return NextResponse.json({ ok: true, count: d.reminders.length });
}
