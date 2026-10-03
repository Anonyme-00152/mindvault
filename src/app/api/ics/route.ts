import { buildIcs, eventFromQuery } from "@/lib/ics";

export const runtime = "nodejs";

/**
 * Streams a single-event .ics. iOS Safari needs a real URL with the
 * text/calendar type to show the "Add to Calendar" sheet — a blob: or data:
 * URL does not. The event data lives in the query string of *your own* request
 * and is never stored.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ev = eventFromQuery(url.searchParams);
  if (!ev) return new Response("Bad event", { status: 400 });
  const body = buildIcs([ev]);
  const file = `${ev.title.replace(/[^\w\- ]+/g, "").trim().slice(0, 60) || "event"}.ics`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    },
  });
}
