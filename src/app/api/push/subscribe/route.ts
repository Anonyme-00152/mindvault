import { NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/session-server";
import { deviceId, getPushStore, type PushSubscriptionJSON } from "@/lib/push-store";
import { DEFAULT_LEAD_MIN } from "@/lib/reminders";

export const runtime = "nodejs";

function validSub(s: unknown): s is PushSubscriptionJSON {
  const x = s as PushSubscriptionJSON;
  return Boolean(x && typeof x.endpoint === "string" && x.endpoint.startsWith("https://") && x.keys && typeof x.keys.p256dh === "string" && typeof x.keys.auth === "string");
}

/** Register (or refresh) this browser's push subscription. */
export async function POST(req: Request) {
  const session = await sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { subscription?: unknown; leadMin?: number };
  if (!validSub(body.subscription)) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });

  const store = getPushStore();
  const id = await deviceId(body.subscription.endpoint);
  const existing = await store.get(id);
  const now = new Date().toISOString();
  await store.put({
    id,
    user: session.user,
    subscription: body.subscription,
    reminders: existing?.reminders ?? [],
    sent: existing?.sent ?? [],
    leadMin: typeof body.leadMin === "number" ? body.leadMin : (existing?.leadMin ?? DEFAULT_LEAD_MIN),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
  return NextResponse.json({ ok: true, deviceId: id });
}

/** Unregister this browser. */
export async function DELETE(req: Request) {
  const session = await sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (!body.endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  const store = getPushStore();
  const id = await deviceId(body.endpoint);
  const d = await store.get(id);
  if (d && d.user === session.user) await store.delete(id);
  return NextResponse.json({ ok: true });
}
