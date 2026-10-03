/**
 * Stateless session: `${user}.${exp}.${hmac}` signed with SESSION_SECRET.
 * Uses Web Crypto only so the same code runs in the Edge middleware and in
 * Node route handlers. No secrets ever reach the client bundle.
 */
export const SESSION_COOKIE = "mv_session";
const SESSION_TTL_S = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET must be set (16+ chars). See .env.example");
  }
  return s;
}

async function hmac(data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64url(new Uint8Array(sig));
}

function b64url(bytes: Uint8Array) {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createSession(user: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
  const payload = `${encodeURIComponent(user)}.${exp}`;
  const sig = await hmac(payload);
  return { token: `${payload}.${sig}`, maxAge: SESSION_TTL_S };
}

export async function verifySession(token: string | undefined | null) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [user, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  const expected = await hmac(`${user}.${expStr}`);
  if (!timingSafeEqual(expected, sig)) return null;
  return { user: decodeURIComponent(user), exp };
}

export function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function checkCredentials(user: string, password: string) {
  const u = process.env.AUTH_USER ?? "";
  const p = process.env.AUTH_PASSWORD ?? "";
  if (!u || !p) return false;
  // Pad to equal length before the constant-time compare so length never leaks.
  const pad = (s: string, n: number) => s.padEnd(n, "\0");
  const n = Math.max(u.length, user.length, p.length, password.length);
  return timingSafeEqual(pad(u, n), pad(user, n)) && timingSafeEqual(pad(p, n), pad(password, n));
}
