"use client";

import Dexie, { type EntityTable } from "dexie";
import type { AIMessage, Note, VaultFile } from "./types";
import { seedNotes } from "./seed";

/**
 * Local-first storage. IndexedDB via Dexie: no 5 MB localStorage ceiling, binary
 * blobs stored natively, transactional writes.
 */
class VaultDB extends Dexie {
  notes!: EntityTable<Note, "id">;
  files!: EntityTable<VaultFile, "id">;
  messages!: EntityTable<AIMessage, "id">;
  meta!: EntityTable<{ key: string; value: string }, "key">;

  constructor() {
    super("mindvault");
    this.version(1).stores({
      notes: "id, date, updatedAt, priority, category, pinned, *tags",
      files: "id, noteId, kind, createdAt",
      messages: "id, createdAt",
      meta: "key",
    });
  }
}

export const db = new VaultDB();

/**
 * The vault starts empty: no sample notes in the product (the marketing site keeps
 * its own sample content). Browsers that received the earlier seed get it removed
 * once, unless the user edited those notes.
 */
export async function ensureClean() {
  const done = await db.meta.get("seed-removed");
  if (done) return;
  const seeded = await db.meta.get("seeded");
  if (seeded) {
    const seedIds = new Set(seedNotes().map((n) => n.id));
    const stale = (await db.notes.toArray()).filter((n) => seedIds.has(n.id) && n.updatedAt <= seeded.value);
    for (const n of stale) await deleteNote(n.id);
  }
  await db.meta.put({ key: "seed-removed", value: new Date().toISOString() });
}

export async function upsertNote(note: Note) {
  await db.notes.put({ ...note, updatedAt: new Date().toISOString() });
}

export async function deleteNote(id: string) {
  await db.transaction("rw", db.notes, db.files, async () => {
    await db.files.where("noteId").equals(id).delete();
    await db.notes.delete(id);
  });
}

export async function addFile(noteId: string, file: File, kind: VaultFile["kind"]) {
  const record: VaultFile = {
    id: `f_${crypto.randomUUID().slice(0, 8)}`,
    noteId,
    name: file.name,
    kind,
    mime: file.type || "application/octet-stream",
    size: file.size,
    blob: file,
    createdAt: new Date().toISOString(),
  };
  await db.files.add(record);
  return record;
}

export async function wipeAll() {
  await db.transaction("rw", db.notes, db.files, db.messages, db.meta, async () => {
    await Promise.all([db.notes.clear(), db.files.clear(), db.messages.clear(), db.meta.clear()]);
  });
}

/** Snapshot for JSON backup / device transfer (files base64-encoded). */
export async function exportSnapshot() {
  const [notes, files, messages] = await Promise.all([
    db.notes.toArray(),
    db.files.toArray(),
    db.messages.toArray(),
  ]);
  const encoded = await Promise.all(
    files.map(async (f) => ({ ...f, blob: undefined, data: await blobToBase64(f.blob) })),
  );
  return { version: 2, exportedAt: new Date().toISOString(), notes, files: encoded, messages };
}

export async function importSnapshot(json: unknown) {
  const snap = json as {
    version: number;
    notes: Note[];
    files: (Omit<VaultFile, "blob"> & { data: string })[];
    messages?: AIMessage[];
  };
  if (!snap || !Array.isArray(snap.notes)) throw new Error("Invalid backup file");
  const files: VaultFile[] = (snap.files ?? []).map((f) => ({
    ...f,
    blob: base64ToBlob(f.data, f.mime),
  }));
  await db.transaction("rw", db.notes, db.files, db.messages, db.meta, async () => {
    await db.notes.bulkPut(snap.notes);
    await db.files.bulkPut(files);
    if (snap.messages) await db.messages.bulkPut(snap.messages);
    await db.meta.put({ key: "seeded", value: new Date().toISOString() });
  });
  return { notes: snap.notes.length, files: files.length };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export function base64ToBlob(b64: string, mime: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
