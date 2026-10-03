import { NextResponse } from "next/server";

/** Tells the UI whether a model is configured. Never exposes the key. */
export async function GET() {
  return NextResponse.json({ mode: process.env.OPENAI_API_KEY ? "openai" : "local" });
}
