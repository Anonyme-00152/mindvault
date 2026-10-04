"use client";

import { motion } from "motion/react";
import { CalendarDays, Clock, Paperclip, Pin } from "lucide-react";
import { format } from "date-fns";
import type { Note, VaultFile } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/types";
import { useCover } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import { cn } from "@/lib/utils";

export const PRI_COLOR: Record<string, string> = { urgent: "#d97706", high: "#5b4bff", medium: "#0a9fd8", low: "#12a86f" };

function Ring({ done, total }: { done: number; total: number }) {
  const c = 2 * Math.PI * 7;
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b4bff" />
          <stop offset="0.6" stopColor="#0a9fd8" />
          <stop offset="1" stopColor="#12a86f" />
        </linearGradient>
      </defs>
      <circle cx="9" cy="9" r="7" fill="none" stroke="var(--line)" strokeWidth="2.5" />
      <circle
        cx="9"
        cy="9"
        r="7"
        fill="none"
        stroke={done === total ? "var(--ok)" : "url(#ring-grad)"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={`${(done / total) * c} ${c}`}
        transform="rotate(-90 9 9)"
      />
    </svg>
  );
}

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
  const when = note.date ? format(new Date(note.date + "T00:00:00"), "d MMM") : null;
  // A note saved a moment ago gets a brief glow so you can see where it landed.
  const fresh = Date.now() - Date.parse(note.updatedAt) < 2500;

  if (compact) {
    return (
      <motion.button
        type="button"
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
        onClick={() => openEditor(note)}
        className={cn(fresh && "just-saved", "group @container w-full text-left flex items-center gap-3 min-h-[56px] px-3.5 py-2.5 rounded-xl border border-line bg-bg-elev shadow-[var(--shadow-card)] hover:border-line-strong hover:shadow-[var(--shadow)] transition-[border-color,box-shadow]")}
      >
        <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: PRI_COLOR[note.priority] }} aria-hidden />
        <span className="w-12 shrink-0 text-[12px] tabular-nums text-fg-faint font-medium">{note.time ?? when ?? "—"}</span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5">
            {note.pinned && <Pin size={12} className="text-brand shrink-0" />}
            <span className="block truncate text-[14px] font-medium text-fg">{note.title || "Untitled"}</span>
          </span>
          <span className="flex items-center gap-2 text-[12px] text-fg-faint mt-0.5 min-w-0">
            <span>{CATEGORY_LABEL[note.category]}</span>
            {note.tags.length > 0 && <span className="truncate">{note.tags.map((t) => `#${t}`).join(" ")}</span>}
          </span>
        </span>
        {attachments > 0 && (
          <span className="hidden @md:inline-flex items-center gap-1 text-[12px] text-fg-faint">
            <Paperclip size={12} /> {attachments}
          </span>
        )}
        {total > 0 && (
          <span className="hidden @md:inline-flex items-center gap-1.5 text-[12px] text-fg-faint tabular-nums">
            <Ring done={done} total={total} />
            {done}/{total}
          </span>
        )}
        <span className="chip" data-p={note.priority}>
          {note.priority}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.article
      layout
      layoutId={`note-${note.id}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.035, 0.35), ease: [0.22, 1, 0.36, 1] }}
      onClick={() => openEditor(note)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openEditor(note))}
      tabIndex={0}
      role="button"
      className={cn(fresh && "just-saved", "group cursor-pointer overflow-hidden flex flex-col rounded-2xl border border-line bg-bg-elev shadow-[var(--shadow-card)] hover:border-line-strong hover:shadow-[var(--shadow)] hover:-translate-y-px transition-[border-color,box-shadow,transform] duration-300")}
    >
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="w-full aspect-[16/8] object-cover border-b border-line" />
      )}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="chip" data-p={note.priority}>
            {note.priority}
          </span>
          <span className="text-[12px] text-fg-faint">{CATEGORY_LABEL[note.category]}</span>
          {note.pinned && <Pin size={13} className="ml-auto text-brand" aria-label="Pinned" />}
        </div>
        <h3 className="text-[15px] font-semibold tracking-[-0.015em] leading-snug line-clamp-2">{note.title || "Untitled"}</h3>
        {note.content && <p className="text-[13px] text-fg-muted leading-relaxed line-clamp-3 mt-1.5">{note.content}</p>}

        {total > 0 && (
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-[11.5px] text-fg-faint mb-1.5 tabular-nums">
              <span>Tasks</span>
              <span>
                {done}/{total}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-glass-hover overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(done / total) * 100}%`, background: done === total ? "var(--ok)" : "var(--grad)" }} />
            </div>
          </div>
        )}

        <div className="mt-auto pt-3.5 flex items-center gap-3 text-[12px] text-fg-faint">
          {when && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={12} /> {when}
            </span>
          )}
          {note.time && (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Clock size={12} /> {note.time}
              {note.endTime ? `–${note.endTime}` : ""}
            </span>
          )}
          {attachments > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip size={12} /> {attachments}
            </span>
          )}
          {!when && !note.time && <span>Edited {format(new Date(note.updatedAt), "d MMM")}</span>}
          {note.tags.length > 0 && (
            <span className="ml-auto flex gap-1 min-w-0 overflow-hidden">
              {note.tags.slice(0, 2).map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded-md bg-brand-soft text-brand text-[11px] font-medium whitespace-nowrap">
                  #{t}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
