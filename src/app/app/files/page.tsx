"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, Trash2, X } from "lucide-react";
import { db } from "@/lib/db";
import { useFiles, useNotes, useObjectURL } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import type { FileKind, VaultFile } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";
import { FileThumb } from "@/components/app/FileThumb";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";

const KINDS: (FileKind | "all")[] = ["all", "image", "video", "document", "other"];

export default function FilesPage() {
  const files = useFiles();
  const notes = useNotes();
  const { notify, openEditor } = useUI();
  const [kind, setKind] = useState<FileKind | "all">("all");
  const [preview, setPreview] = useState<VaultFile | null>(null);

  useEffect(() => {
    document.title = "Files · MindVault";
  }, []);

  const list = useMemo(() => (files ?? []).filter((f) => kind === "all" || f.kind === kind), [files, kind]);
  const total = useMemo(() => (files ?? []).reduce((a, f) => a + f.size, 0), [files]);
  const noteTitle = (id: string) => notes?.find((n) => n.id === id)?.title ?? "Untitled";

  async function remove(f: VaultFile) {
    await db.files.delete(f.id);
    setPreview(null);
    notify("File removed");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <PageHeader
        eyebrow={`${files?.length ?? 0} files · ${formatBytes(total)}`}
        title="Files"
        subtitle="Everything attached to your notes, stored in this browser's database."
      />
      <div className="flex flex-wrap gap-2 mb-6">
        {KINDS.map((k) => (
          <button key={k} onClick={() => setKind(k)} className="pill capitalize" data-on={kind === k}>
            {k}
          </button>
        ))}
      </div>

      {files === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[4/3]" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState title="No files yet" body="Attach images, video or documents from any note." action={{ label: "New note", onClick: () => openEditor("new") }} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((f, i) => (
            <motion.button
              key={f.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.4 }}
              onClick={() => setPreview(f)}
              className="glass glass-hover overflow-hidden text-left"
             
             
            >
              <FileThumb file={f} className="aspect-[4/3]" />
              <div className="p-3">
                <p className="text-[13px] truncate">{f.name}</p>
                <p className="text-[11px] text-fg-faint font-mono mt-0.5">
                  {formatBytes(f.size)} · {noteTitle(f.noteId)}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>{preview && <Preview file={preview} noteTitle={noteTitle(preview.noteId)} onClose={() => setPreview(null)} onDelete={() => remove(preview)} />}</AnimatePresence>
    </div>
  );
}

function Preview({ file, noteTitle, onClose, onDelete }: { file: VaultFile; noteTitle: string; onClose: () => void; onDelete: () => void }) {
  const url = useObjectURL(file.blob);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[65] flex items-center justify-center p-4 md:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-overlay backdrop-blur-[3px]" onClick={onClose} />
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 10 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="relative glass !bg-bg-elev !shadow-[var(--shadow-pop)] max-w-5xl w-full max-h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-line">
          <div className="min-w-0">
            <p className="text-[14px] truncate">{file.name}</p>
            <p className="text-[11px] text-fg-faint font-mono">
              {formatBytes(file.size)} · {file.mime} · {noteTitle}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {url && (
              <a href={url} download={file.name} className="btn-icon" aria-label="Download">
                <Download size={15} />
              </a>
            )}
            <button className="btn-icon hover:!text-danger" onClick={onDelete} aria-label="Delete">
              <Trash2 size={15} />
            </button>
            <button className="btn-icon" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-[40vh] flex items-center justify-center bg-bg overflow-auto">
          {file.kind === "image" && url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={file.name} className="max-h-[75vh] object-contain" />
          ) : file.kind === "video" && url ? (
            <video src={url} controls className="max-h-[75vh]" />
          ) : file.mime === "application/pdf" && url ? (
            <iframe src={url} title={file.name} className="w-full h-[75vh]" />
          ) : (
            <div className="p-10 text-center text-fg-muted text-[14px]">
              No preview for this type.
              {url && (
                <a href={url} download={file.name} className="btn btn-ghost btn-sm mt-4 mx-auto flex w-fit">
                  Download
                </a>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
