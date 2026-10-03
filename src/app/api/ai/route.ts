import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { localAnswer, type Lang, type NoteContext } from "@/lib/ai-local";

export const runtime = "nodejs";

interface Body {
  messages: { role: "user" | "assistant"; content: string }[];
  notes: NoteContext[];
  today: string;
  /** public landing demo: never spends API credits */
  demo?: boolean;
  /** browser language hint, e.g. "fr" */
  lang?: string;
}

const SYSTEM = `You are Vault, the assistant inside MindVault — a private, local-first notes app.
You only know what is in the user's notes provided below. Be concise, warm and concrete.
Always answer in the language the user writes in (French, English, Spanish, …), and understand typos.
Small talk is fine — greet back briefly, then offer help. Use short paragraphs or bullets.
Bold note titles with **double asterisks**. Never invent notes. You cannot create or edit notes.`;

function streamText(chunks: () => AsyncIterable<string>) {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const c of chunks()) controller.enqueue(enc.encode(c));
        } catch (e) {
          controller.enqueue(enc.encode(`\n\n_Error: ${(e as Error).message}_`));
        } finally {
          controller.close();
        }
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

async function* typewriter(text: string) {
  const words = text.split(/(\s+)/);
  for (const w of words) {
    yield w;
    await new Promise((r) => setTimeout(r, w.trim() ? 18 : 4));
  }
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { messages = [], notes = [], today, demo } = body;
  const langHint = (["en", "fr", "es", "de", "it", "pt"].includes(String(body.lang).slice(0, 2)) ? String(body.lang).slice(0, 2) : "en") as Lang;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No message" }, { status: 400 });
  }
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${SESSION_COOKIE}=`))?.split("=")[1];
  const session = await verifySession(token);

  const apiKey = process.env.OPENAI_API_KEY;
  const useLocal = demo || !session || !apiKey;

  if (useLocal) {
    const answer = localAnswer(lastUser, notes.slice(0, 200), today, langHint);
    return streamText(() => typewriter(answer));
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });
  const context = notes
    .slice(0, 120)
    .map(
      (n) =>
        `- ${n.title} [${n.priority}, ${n.category}${n.date ? `, ${n.date}${n.time ? " " + n.time + (n.endTime ? "-" + n.endTime : "") : ""}` : ""}]${n.tags.length ? ` #${n.tags.join(" #")}` : ""}\n  ${n.content.replace(/\n+/g, " ").slice(0, 400)}${n.checklist.length ? `\n  tasks: ${n.checklist.map((c) => `${c.done ? "[x]" : "[ ]"} ${c.text}`).join("; ")}` : ""}`,
    )
    .join("\n");

  const stream = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    stream: true,
    temperature: 0.4,
    messages: [
      { role: "system", content: `${SYSTEM}\n\nToday is ${today}.\n\nNOTES:\n${context}` },
      ...messages.slice(-12),
    ],
  });

  return streamText(async function* () {
    for await (const part of stream) {
      const delta = part.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  });
}
