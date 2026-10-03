import { NextResponse } from "next/server";

/** Public VAPID key + whether push is configured on this deployment. */
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY ?? "";
  return NextResponse.json({ enabled: Boolean(key && process.env.VAPID_PRIVATE_KEY), publicKey: key });
}
