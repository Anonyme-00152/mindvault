"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useState } from "react";
import { db } from "./db";
import type { Note, VaultFile } from "./types";

export function useNotes() {
  const notes = useLiveQuery(() => db.notes.orderBy("updatedAt").reverse().toArray(), []);
  return notes ?? null;
}

export function useFiles(noteId?: string) {
  const files = useLiveQuery(
    () => (noteId ? db.files.where("noteId").equals(noteId).toArray() : db.files.orderBy("createdAt").reverse().toArray()),
    [noteId],
  );
  return files ?? null;
}

export function useMessages() {
  const msgs = useLiveQuery(() => db.messages.orderBy("createdAt").toArray(), []);
  return msgs ?? null;
}

/** Object URL for a blob, revoked on unmount. */
export function useObjectURL(blob?: Blob | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

export function useCover(note: Note | null | undefined, files: VaultFile[] | null) {
  const cover = useMemo(() => {
    if (!note || !files) return null;
    const byId = note.coverId ? files.find((f) => f.id === note.coverId) : null;
    return byId ?? files.find((f) => f.noteId === note.id && f.kind === "image") ?? null;
  }, [note, files]);
  return useObjectURL(cover?.blob);
}

export function useHotkey(combo: string, handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const [mod, key] = combo.split("+");
    const onKey = (e: KeyboardEvent) => {
      const modOk = mod === "mod" ? e.metaKey || e.ctrlKey : true;
      if (modOk && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [combo, handler]);
}
