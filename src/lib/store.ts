"use client";

import { create } from "zustand";
import type { Note } from "./types";

type Theme = "dark" | "light";

interface UIState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  editing: Note | "new" | null;
  /** prefilled fields when creating (e.g. date from the calendar) */
  draft: Partial<Note> | null;
  /** increments on every open so a fresh editor instance mounts even mid exit-animation */
  editorSeq: number;
  openEditor: (n: Note | "new", draft?: Partial<Note>) => void;
  closeEditor: () => void;
  search: string;
  setSearch: (s: string) => void;
  toast: { id: number; text: string; action?: ToastAction } | null;
  /** optional action button; toasts with an action stay longer */
  notify: (text: string, action?: ToastAction) => void;
  dismissToast: () => void;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export const useUI = create<UIState>((set) => ({
  theme: "dark",
  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = theme;
      try {
        localStorage.setItem("mv-theme", theme);
      } catch {}
    }
  },
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  editing: null,
  draft: null,
  editorSeq: 0,
  openEditor: (editing, draft = undefined) => set((s) => ({ editing, draft: draft ?? null, editorSeq: s.editorSeq + 1 })),
  closeEditor: () => set({ editing: null, draft: null }),
  search: "",
  setSearch: (search) => set({ search }),
  toast: null,
  notify: (text, action) => {
    const id = Date.now();
    set({ toast: { id, text, action } });
    setTimeout(() => set((s) => (s.toast?.id === id ? { toast: null } : {})), action ? 7000 : 2600);
  },
  dismissToast: () => set({ toast: null }),
}));

/**
 * Per-frame values (scroll progress, pointer) live outside React state on
 * purpose: the WebGL scene reads them in useFrame without triggering renders.
 */
export const motionState = {
  /** 0 → 1 progress of the vault-opening sequence */
  vault: 0,
  /** 0 → 1 progress of the hero (fades the scene out) */
  hero: 0,
  /** pointer in -1..1 */
  px: 0,
  py: 0,
  /** login screen feedback */
  shake: 0,
  open: 0,
};
