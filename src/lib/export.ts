"use client";

import { endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { db } from "./db";
import type { Note, VaultFile } from "./types";
import { toISODate } from "./utils";

export type Period = "week" | "month" | "year" | "all";

export function rangeFor(period: Period, now = new Date()) {
  switch (period) {
    case "week":
      return [toISODate(startOfWeek(now, { weekStartsOn: 1 })), toISODate(endOfWeek(now, { weekStartsOn: 1 }))];
    case "month":
      return [toISODate(startOfMonth(now)), toISODate(endOfMonth(now))];
    case "year":
      return [toISODate(startOfYear(now)), toISODate(endOfYear(now))];
    default:
      return null;
  }
}

export function inPeriod(note: Note, period: Period) {
  const r = rangeFor(period);
  if (!r) return true;
  const d = note.date ?? note.createdAt.slice(0, 10);
  return d >= r[0] && d <= r[1];
}

export function noteToMarkdown(n: Note, files: VaultFile[]) {
  const lines = [`# ${n.title || "Untitled"}`, ""];
  const meta = [`priority: ${n.priority}`, `category: ${n.category}`];
  if (n.date) meta.push(`date: ${n.date}${n.time ? ` ${n.time}` : ""}`);
  if (n.tags.length) meta.push(`tags: ${n.tags.map((t) => `#${t}`).join(" ")}`);
  lines.push(`> ${meta.join(" · ")}`, "");
  if (n.content) lines.push(n.content, "");
  if (n.checklist.length) {
    lines.push("## Checklist", "");
    n.checklist.forEach((c) => lines.push(`- [${c.done ? "x" : " "}] ${c.text}`));
    lines.push("");
  }
  if (files.length) {
    lines.push("## Attachments", "");
    files.forEach((f) => lines.push(`- [${f.name}](./files/${safe(f.name)})`));
    lines.push("");
  }
  lines.push(`_Created ${n.createdAt.slice(0, 10)} · Updated ${n.updatedAt.slice(0, 10)}_`);
  return lines.join("\n");
}

export function safe(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
}

export async function exportZip(period: Period) {
  const { default: JSZip } = await import("jszip");
  const notes = (await db.notes.toArray()).filter((n) => inPeriod(n, period));
  const files = await db.files.toArray();
  const zip = new JSZip();
  const notesDir = zip.folder("notes")!;
  const filesDir = zip.folder("files")!;
  const used = new Set<string>();
  for (const n of notes) {
    const nf = files.filter((f) => f.noteId === n.id);
    notesDir.file(`${safe(n.title || "untitled")}-${n.id}.md`, noteToMarkdown(n, nf));
    for (const f of nf) {
      let name = safe(f.name);
      if (used.has(name)) name = `${f.id}-${name}`;
      used.add(name);
      filesDir.file(name, f.blob);
    }
  }
  zip.file("index.json", JSON.stringify({ exportedAt: new Date().toISOString(), period, notes: notes.length }, null, 2));
  const blob = await zip.generateAsync({ type: "blob" });
  download(blob, `mindvault-${period}-${toISODate(new Date())}.zip`);
  return notes.length;
}

export async function exportPdf(period: Period) {
  const { jsPDF } = await import("jspdf");
  const notes = (await db.notes.toArray()).filter((n) => inPeriod(n, period)).sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;
  let y = M;

  const ensure = (h: number) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MindVault", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`${period === "all" ? "All notes" : `This ${period}`} · exported ${toISODate(new Date())} · ${notes.length} notes`, M, y + 16);
  doc.setTextColor(0);
  y += 48;

  for (const n of notes) {
    ensure(60);
    doc.setDrawColor(220);
    doc.line(M, y, W - M, y);
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    const title = doc.splitTextToSize(n.title || "Untitled", W - 2 * M);
    doc.text(title, M, y);
    y += title.length * 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`${n.priority} · ${n.category}${n.date ? ` · ${n.date}${n.time ? " " + n.time : ""}` : ""}${n.tags.length ? ` · ${n.tags.map((t) => "#" + t).join(" ")}` : ""}`, M, y);
    doc.setTextColor(0);
    y += 14;
    if (n.content) {
      doc.setFontSize(10.5);
      const body = doc.splitTextToSize(n.content, W - 2 * M);
      for (const line of body) {
        ensure(14);
        doc.text(line, M, y);
        y += 14;
      }
    }
    if (n.checklist.length) {
      y += 4;
      for (const c of n.checklist) {
        ensure(14);
        doc.setFontSize(10);
        doc.text(`${c.done ? "☑" : "☐"} ${c.text}`, M + 4, y);
        y += 14;
      }
    }
    y += 14;
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`${i} / ${pages}`, W - M, H - 28, { align: "right" });
  }
  doc.save(`mindvault-${period}-${toISODate(new Date())}.pdf`);
  return notes.length;
}

export function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
