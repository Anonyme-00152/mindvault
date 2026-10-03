"use client";

import { motion } from "motion/react";
import { Clock, Paperclip, Pin } from "lucide-react";
import { format } from "date-fns";
import type { Note, VaultFile } from "@/lib/types";
import { useCover } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import { cn } from "@/lib/utils";

export function NoteCard({
  note,
  files,
  compact = false,
  index = 0,
}: {
  note: Note;
  files: VaultFile[] | null;
  compact?: boolean;
  index?: number;
}) {
  const { openEditor } = useUI();
  const cover = useCover(note, files);
  const attachments = files?.filter((f) => f.noteId === note.id).length ?? 0;
  const done = note.checklist.filter((c) => c.done).length;
  const total = note.checklist.length;

  return (
    <motion.article
      layout
      // Shared-element id only in the main grid: the same note can appear in two
      // dashboard lists at once, and duplicate layoutIds make Motion hide one.
      layoutId={compact ? undefined : `note-${note.id}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      onClick={() => openEditor(note)}
      className={cn("glass glass-hover cursor-pointer overflow-hidden flex", compact ? "flex-row items-center gap-3 p-3" : "flex-col")}
      data-cursor="text"
      data-cursor-label="Open"
    >
      {cover && !compact && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="w-full aspect-[16/9] object-cover" />
      )}
      <div className={cn("min-w-0 flex-1", compact ? "" : "p-4")}>
        <div className={cn("flex items-center gap-2", compact ? "mb-0.5" : "mb-2.5")}>
          <span className="chip" data-p={note.priority}>
            {note.priority}
          </span>
          {note.pinned && <Pin size={12} className="text-fg-faint" />}
          <span className="ml-auto font-mono text-[10px] text-fg-faint">
            {note.date ? format(new Date(note.date + "T00:00:00"), "d MMM") : format(new Date(note.updatedAt), "d MMM")}
          </span>
        </div>
        <h3 className={cn("font-medium leading-snug truncate", compact ? "text-[14px]" : "text-[15px] mb-1")}>{note.title || "Untitled"}</h3>
        {!compact && note.content && <p className="text-[13px] text-fg-muted leading-relaxed line-clamp-3">{note.content}</p>}
        <div className={cn("flex items-center gap-3 text-[11px] text-fg-faint", compact ? "mt-0.5" : "mt-3")}>
          {note.time && (
            <span className="inline-flex items-center gap-1">
              <Clock size={11} /> {note.time}
              {note.endTime ? `–${note.endTime}` : ""}
            </span>
          )}
          {total > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-12 h-1 rounded-full bg-line overflow-hidden">
                <span className="block h-full bg-grad" style={{ width: `${(done / total) * 100}%` }} />
              </span>
              {done}/{total}
            </span>
          )}
          {attachments > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip size={11} /> {attachments}
            </span>
          )}
          {note.tags.length > 0 && !compact && <span className="truncate ml-auto">{note.tags.map((t) => `#${t}`).join(" ")}</span>}
        </div>
      </div>
    </motion.article>
  );
}
