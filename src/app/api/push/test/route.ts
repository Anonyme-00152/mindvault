import { NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/session-server";
import { deviceId, getPushStore } from "@/lib/push-store";
import { vapidConfigured, webPushSender } from "@/lib/push-send";

export const runtime = "nodejs";

/** Send a real push to the calling browser — the "does it work on my phone?" button. */
export async function POST(req: Request) {
  const session = await sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!vapidConfigured()) return NextResponse.json({ error: "Push is not configured on the server (VAPID keys)." }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (!body.endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  const d = await getPushStore().get(await deviceId(body.endpoint));
  if (!d || d.user !== session.user) return NextResponse.json({ error: "This browser is not subscribed." }, { status: 404 });
  const res = await webPushSender(d, { title: "MindVault", body: "Push notifications are working on this device.", url: "/app/settings", tag: "test" });
  if (!res.ok) {
    if (res.gone) await getPushStore().delete(d.id);
    return NextResponse.json({ error: `Push service refused: ${res.error}` }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
