import { NextResponse } from "next/server";
import { checkCredentials, createSession, SESSION_COOKIE } from "@/lib/auth";

// Tiny in-memory throttle: 5 failed attempts per IP per minute.
const attempts = new Map<string, { n: number; t: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const a = attempts.get(ip);
  if (a && now - a.t < 60_000 && a.n >= 5) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  let body: { user?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {}
  const user = String(body.user ?? "").trim();
  const password = String(body.password ?? "");

  if (!checkCredentials(user, password)) {
    attempts.set(ip, { n: a && now - a.t < 60_000 ? a.n + 1 : 1, t: now });
    // Small constant delay to blunt brute force without hurting UX.
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  attempts.delete(ip);
  const { token, maxAge } = await createSession(user);
  const res = NextResponse.json({ ok: true, user });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return res;
}
