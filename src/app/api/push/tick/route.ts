import { NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/session-server";
import { tick, vapidConfigured } from "@/lib/push-send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduler pass. Called by Vercel Cron (Bearer CRON_SECRET) every minute, and
 * opportunistically by any signed-in client while the app is open.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const cronOk = Boolean(process.env.CRON_SECRET) && auth === `Bearer ${process.env.CRON_SECRET}`;
  const session = cronOk ? null : await sessionFromRequest(req);
  if (!cronOk && !session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!vapidConfigured()) return NextResponse.json({ ok: false, reason: "VAPID keys not configured" }, { status: 503 });
  const report = await tick();
  return NextResponse.json({ ok: true, ...report });
}

export const POST = GET;
