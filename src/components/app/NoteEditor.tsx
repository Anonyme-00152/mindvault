"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Bell, Calendar, Clock, ImageIcon, Paperclip, Pin, PinOff, Plus, Share2, Trash2, X } from "lucide-react";
import { addFile, db, deleteNote, upsertNote } from "@/lib/db";
import { useFiles } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import { CATEGORIES, CATEGORY_LABEL, PRIORITIES, REMIND_DAY_HOUR, REMIND_PRESETS, fileKind, type ChecklistItem, type Note } from "@/lib/types";
import { effectiveLead, leadLabel } from "@/lib/reminders";
import { cn, formatBytes, uid } from "@/lib/utils";
import { FileThumb } from "./FileThumb";
import { PRI_COLOR } from "./NoteCard";
import { CheckMark } from "./CheckMark";
import { AddToCalendar, calendarLinks } from "./AddToCalendar";
import { getLeadMin, shareNote } from "@/lib/pwa";

function blank(): Note {
  const now = new Date().toISOString();
  return {
    id: uid("n"),
    title: "",
    content: "",
    checklist: [],
    priority: "medium",
    category: "personal",
    tags: [],
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function NoteEditor() {
  const { editing, draft, closeEditor, notify } = useUI();
  const initial = editing === "new" || !editing ? { ...blank(), ...draft } : editing;
  const [note, setNote] = useState<Note>(initial);
  const [tagInput, setTagInput] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const files = useFiles(note.id);
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const isNew = editing === "new";
  // Set when a new note was written to the DB early (to attach files); discarded on cancel.
  const draftPersisted = useRef(false);

  /** Cancel: a new note only persisted to hold attachments is removed again. */
  async function discard() {
    if (isNew && draftPersisted.current) await deleteNote(note.id);
    closeEditor();
  }

  // Focus the title once. (Re-running this on every keystroke stole focus from the body
  // and from the iOS date/time pickers — the "typing jumps to the title" bug.)
  useEffect(() => {
    if (isNew && !window.matchMedia("(pointer: coarse)").matches) titleRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") discard();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  const set = <K extends keyof Note>(k: K, v: Note[K]) => setNote((n) => ({ ...n, [k]: v }));

  async function save() {
    if (!note.title.trim() && !note.content.trim() && note.checklist.length === 0) {
      notify("Add a title or some content first.");
      return;
    }
    const saved = { ...note, title: note.title.trim() || "Untitled" };
    await upsertNote(saved);
    closeEditor();
    // A dated note can go straight into the phone's calendar — offer it once, right after saving.
    const prev = isNew ? null : (editing as Note);
    const scheduledChanged = !prev || saved.date !== prev.date || saved.time !== prev.time || saved.endTime !== prev.endTime;
    const links = saved.date && scheduledChanged ? calendarLinks(saved) : null;
    if (links) {
      notify(isNew ? "Note created — add it to your calendar?" : "Saved — update your calendar?", {
        label: "Add to Calendar",
        onClick: () => {
          window.location.href = links.ics;
        },
      });
    } else {
      notify(isNew ? "Note created" : "Saved");
    }
  }

  async function share() {
    const r = await shareNote(note);
    if (r === "copied") notify("Copied to clipboard");
    else if (r === "failed") notify("Sharing is not available here");
  }

  async function remove() {
    await deleteNote(note.id);
    notify("Note deleted");
    closeEditor();
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (t && !note.tags.includes(t)) set("tags", [...note.tags, t]);
    setTagInput("");
  }

  function addTask() {
    const t = taskInput.trim();
    if (!t) return;
    set("checklist", [...note.checklist, { id: uid("c"), text: t, done: false }]);
    setTaskInput("");
  }

  function updateTask(id: string, patch: Partial<ChecklistItem>) {
    set(
      "checklist",
      note.checklist.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  }

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    // Files need the note to exist so the id is stable — persist a draft silently.
    const exists = await db.notes.get(note.id);
    if (!exists) {
      await db.notes.put({ ...note, title: note.title.trim() || "Untitled" });
      draftPersisted.current = true;
    }
    for (const f of Array.from(list)) {
      if (f.size > 50 * 1024 * 1024) {
        notify(`${f.name} is over 50 MB`);
        continue;
      }
      const rec = await addFile(note.id, f, fileKind(f.type));
      if (rec.kind === "image" && !note.coverId) set("coverId", rec.id);
    }
    notify(`${list.length} file${list.length > 1 ? "s" : ""} attached`);
  }

  const done = note.checklist.filter((c) => c.done).length;
  const reminderOn = note.time ? effectiveLead(note, getLeadMin()) !== null : note.remindDay === "same" || note.remindDay === "before";

  return (
    <motion.div
      className="fixed inset-0 z-[65] flex items-stretch sm:items-center justify-center p-0 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-overlay backdrop-blur-[3px]" onClick={discard} />
      <motion.div
        role="dialog"
        aria-modal
        aria-label={isNew ? "New note" : "Edit note"}
        layoutId={isNew ? undefined : `note-${note.id}`}
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[90vh] bg-bg-elev sm:border sm:border-line sm:rounded-2xl shadow-[var(--shadow-pop)] flex flex-col overflow-hidden"
        style={{ paddingTop: "var(--sat)" }}
        data-lenis-prevent
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 sm:px-6 h-14 border-b border-line shrink-0 min-w-0 [&>span:first-child]:truncate">
          <span className="text-[13px] text-fg-faint">
            Notes <span className="mx-1">/</span>
            <span className="text-fg font-medium">{isNew ? "New note" : note.title.trim() || "Untitled"}</span>
          </span>
          <span className="ml-auto flex items-center gap-1">
            <button className="btn-icon" onClick={share} aria-label="Share" title="Share">
              <Share2 size={15} />
            </button>
            <button className="btn-icon" onClick={() => set("pinned", !note.pinned)} aria-label="Pin" title="Pin">
              {note.pinned ? <Pin size={15} className="text-brand" /> : <PinOff size={15} />}
            </button>
            {!isNew && (
              <button
                className={cn("btn-icon", confirmDelete && "!text-danger !border-danger/40")}
                onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
                onBlur={() => setConfirmDelete(false)}
                aria-label="Delete"
                title={confirmDelete ? "Click again to confirm" : "Delete"}
               
              >
                <Trash2 size={15} />
              </button>
            )}
            <button className="btn-icon" onClick={discard} aria-label="Close">
              <X size={16} />
            </button>
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
          <input
            ref={titleRef}
            value={note.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Title"
            className="title-input w-full bg-transparent outline-none text-[26px] sm:text-[30px] font-semibold tracking-[-0.03em] leading-tight placeholder:text-fg-faint"
          />

          <div className="flex flex-wrap gap-2">
            <div className="seg" role="radiogroup" aria-label="Priority">
              {PRIORITIES.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={note.priority === p} data-on={note.priority === p} onClick={() => set("priority", p)} className="capitalize">
                  <span className="w-2 h-2 rounded-full" style={{ background: PRI_COLOR[p] }} />
                  {p}
                </button>
              ))}
            </div>
            <select className="field !w-auto !h-9 !text-[13px]" value={note.category} onChange={(e) => set("category", e.target.value as Note["category"])} aria-label="Category">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule: date, start/end time, reminder */}
          <section className="rounded-xl border border-line bg-bg p-3 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="field !w-auto !h-10 flex items-center gap-2 text-[13px]">
                <Calendar size={13} className="text-fg-faint" />
                <input type="date" value={note.date ?? ""} onChange={(e) => set("date", e.target.value || undefined)} className="bg-transparent outline-none" aria-label="Date" />
              </label>
              <label className="field !w-auto !h-10 flex items-center gap-2 text-[13px]">
                <Clock size={13} className="text-fg-faint" />
                <input type="time" value={note.time ?? ""} onChange={(e) => set("time", e.target.value || undefined)} className="bg-transparent outline-none" aria-label="Start time" disabled={!note.date} />
              </label>
              {note.time && (
                <label className="field !w-auto !h-10 flex items-center gap-2 text-[13px]">
                  <span className="text-fg-faint">to</span>
                  <input type="time" value={note.endTime ?? ""} min={note.time} onChange={(e) => set("endTime", e.target.value || undefined)} className="bg-transparent outline-none" aria-label="End time" />
                </label>
              )}
              {note.date && <AddToCalendar note={{ ...note, title: note.title.trim() || "Untitled" }} compact />}
            </div>

            {note.date && (
              <div className="flex flex-wrap items-center gap-2">
                <Bell size={13} className={reminderOn ? "text-brand" : "text-fg-faint"} />
                {note.time ? (
                  <select
                    className="field !w-auto !h-10 text-[13px]"
                    value={note.remindMin === null || note.remind === false ? "off" : note.remindMin === undefined ? "default" : String(note.remindMin)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNote((n) => ({ ...n, remind: undefined, remindMin: v === "off" ? null : v === "default" ? undefined : Number(v) }));
                    }}
                    aria-label="Reminder"
                  >
                    <option value="default">Remind {leadLabel(getLeadMin())} (default)</option>
                    {REMIND_PRESETS.map((m) => (
                      <option key={m} value={m}>
                        Remind {leadLabel(m)}
                      </option>
                    ))}
                    <option value="off">No reminder</option>
                  </select>
                ) : (
                  <select className="field !w-auto !h-10 text-[13px]" value={note.remindDay ?? "none"} onChange={(e) => set("remindDay", e.target.value === "none" ? null : (e.target.value as "same" | "before"))} aria-label="Reminder">
                    <option value="none">No reminder</option>
                    <option value="same">Remind that day at {REMIND_DAY_HOUR}:00</option>
                    <option value="before">Remind the day before at {REMIND_DAY_HOUR}:00</option>
                  </select>
                )}
                <span className="text-[12px] text-fg-faint">{reminderOn ? "On this device and, once notifications are on, on your phone." : "Reminders are off for this note."}</span>
              </div>
            )}
          </section>

          <textarea
            className="field !bg-transparent !border-0 !p-0 !shadow-none text-[15px] leading-relaxed min-h-[140px]"
            placeholder="Write something…"
            value={note.content}
            onChange={(e) => set("content", e.target.value)}
          />

          {/* Checklist */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="eyebrow">Checklist</p>
              {note.checklist.length > 0 && (
                <span className="font-mono text-[11px] text-fg-faint">
                  {done}/{note.checklist.length}
                </span>
              )}
            </div>
            <ul className="space-y-1">
              {note.checklist.map((c) => (
                <li key={c.id} className="group flex items-center gap-3 h-9">
                  <button
                    onClick={() => updateTask(c.id, { done: !c.done })}
                    className="check"
                    data-on={c.done}
                    aria-label={c.done ? "Mark undone" : "Mark done"}
                   
                  >
                    {c.done && <CheckMark />}
                  </button>
                  <input
                    value={c.text}
                    onChange={(e) => updateTask(c.id, { text: e.target.value })}
                    className={cn("flex-1 bg-transparent outline-none text-[14px]", c.done && "line-through text-fg-faint")}
                  />
                  <button
                    onClick={() => set("checklist", note.checklist.filter((x) => x.id !== c.id))}
                    className="btn-icon sm:opacity-0 group-hover:opacity-100 !w-7 !h-7"
                    aria-label="Remove task"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 mt-1">
              <Plus size={14} className="text-fg-faint ml-0.5" />
              <input
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTask())}
                placeholder="Add a task and press Enter"
                className="flex-1 bg-transparent outline-none text-[14px] h-9 placeholder:text-fg-faint"
              />
            </div>
          </section>

          {/* Tags */}
          <section>
            <p className="eyebrow mb-2">Tags</p>
            <div className="flex flex-wrap items-center gap-2">
              {note.tags.map((t) => (
                <button key={t} onClick={() => set("tags", note.tags.filter((x) => x !== t))} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-brand-soft text-brand text-[12.5px] font-medium hover:opacity-80" title="Remove">
                  #{t} <X size={10} />
                </button>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === ",") && (e.preventDefault(), addTag())}
                onBlur={addTag}
                placeholder="Add tag"
                className="bg-transparent outline-none text-[13px] h-6 min-w-[80px] placeholder:text-fg-faint"
              />
            </div>
          </section>

          {/* Files */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="eyebrow">Attachments</p>
              <button className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()}>
                <Paperclip size={13} /> Attach
              </button>
              <input ref={fileInput} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            </div>
            {files && files.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {files.map((f) => (
                  <div key={f.id} className="group relative rounded-xl border border-line bg-bg-elev overflow-hidden">
                    <FileThumb file={f} className="aspect-[4/3]" />
                    <div className="px-2.5 py-2 text-[11px]">
                      <p className="truncate">{f.name}</p>
                      <p className="text-fg-faint font-mono">{formatBytes(f.size)}</p>
                    </div>
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {f.kind === "image" && (
                        <button
                          className={cn("btn-icon !w-7 !h-7 !bg-bg-elev", note.coverId === f.id && "!text-fg !border-line-strong")}
                          onClick={() => set("coverId", note.coverId === f.id ? undefined : f.id)}
                          title="Use as cover"
                          aria-label="Use as cover"
                        >
                          <ImageIcon size={12} />
                        </button>
                      )}
                      <button className="btn-icon !w-7 !h-7 !bg-bg-elev hover:!text-danger" onClick={() => db.files.delete(f.id)} title="Remove" aria-label="Remove file">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={() => fileInput.current?.click()}
                className="w-full h-24 rounded-xl border border-dashed border-line-strong bg-bg text-[13px] text-fg-faint hover:text-fg hover:border-brand hover:bg-brand-soft/40 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onFiles(e.dataTransfer.files);
                }}
               
              >
                Drop images, video or documents here
              </button>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 sm:px-6 h-16 border-t border-line bg-bg shrink-0" style={{ marginBottom: "var(--sab)" }}>
          <span className="text-[12px] text-fg-faint hidden sm:inline">
            <span className="kbd">⌘ ↵</span> to save · <span className="kbd">esc</span> to close
          </span>
          <div className="ml-auto flex gap-2">
            <button className="btn btn-quiet btn-sm" onClick={discard}>
              Cancel
            </button>
            <button className="btn btn-solid btn-sm" onClick={save}>
              {isNew ? "Create note" : "Save changes"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
