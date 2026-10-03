export type Priority = "urgent" | "high" | "medium" | "low";
export type Category = "work" | "personal" | "health" | "finance" | "ideas" | "other";
export type FileKind = "image" | "video" | "document" | "other";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  checklist: ChecklistItem[];
  /** ISO date YYYY-MM-DD */
  date?: string;
  /** HH:MM start */
  time?: string;
  /** HH:MM end (optional, same day) */
  endTime?: string;
  priority: Priority;
  category: Category;
  tags: string[];
  /** id of a VaultFile used as cover */
  coverId?: string;
  pinned: boolean;
  /** legacy on/off flag (v2.0); superseded by remindMin / remindDay */
  remind?: boolean;
  /** timed notes: minutes before start (0 = at the time). null = no reminder. undefined = use the global default */
  remindMin?: number | null;
  /** all-day notes: when to remind. "same" = that day at REMIND_DAY_HOUR, "before" = the day before. undefined/null = none */
  remindDay?: "same" | "before" | null;
  createdAt: string;
  updatedAt: string;
}

/** Binary attachments live in their own table so notes stay light. */
export interface VaultFile {
  id: string;
  noteId: string;
  name: string;
  kind: FileKind;
  mime: string;
  size: number;
  blob: Blob;
  createdAt: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/** Reminder presets for timed notes (minutes before start). */
export const REMIND_PRESETS = [0, 5, 10, 15, 30, 60, 120, 1440] as const;
/** Hour of day used for all-day reminders. */
export const REMIND_DAY_HOUR = 9;

export const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];
export const CATEGORIES: Category[] = ["work", "personal", "health", "finance", "ideas", "other"];

export const CATEGORY_LABEL: Record<Category, string> = {
  work: "Work",
  personal: "Personal",
  health: "Health",
  finance: "Finance",
  ideas: "Ideas",
  other: "Other",
};

export function fileKind(mime: string): FileKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (
    mime === "application/pdf" ||
    mime.startsWith("text/") ||
    mime.includes("document") ||
    mime.includes("sheet") ||
    mime.includes("presentation")
  )
    return "document";
  return "other";
}
