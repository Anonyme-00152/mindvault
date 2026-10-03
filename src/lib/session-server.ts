import { SESSION_COOKIE, verifySession } from "./auth";

/** Session from a Request's cookie header (route handlers). */
export async function sessionFromRequest(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  return verifySession(token);
}
