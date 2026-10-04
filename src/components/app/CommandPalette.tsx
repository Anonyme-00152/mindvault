"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon, Plus, Search, Sun } from "lucide-react";
import { format } from "date-fns";
import { NAV } from "./Shell";
import { PRI_COLOR } from "./NoteCard";
import { useUI } from "@/lib/store";
import { useNotes } from "@/lib/hooks";

export function CommandPalette() {
  const router = useRouter();
  const { paletteOpen, setPaletteOpen, openEditor, theme, setTheme, setSearch } = useUI();
  const notes = useNotes();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!paletteOpen) setQ("");
  }, [paletteOpen]);

  const run = (fn: () => void) => {
    setPaletteOpen(false);
    fn();
  };

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-overlay backdrop-blur-[2px]" onClick={() => setPaletteOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl rounded-2xl border border-line bg-bg-elev shadow-[var(--shadow-pop)] overflow-hidden"
          >
            <Command label="Command palette" loop>
              <div className="flex items-center gap-3 px-4 h-14 border-b border-line">
                <Search size={16} className="text-fg-faint" />
                <Command.Input
                  autoFocus
                  value={q}
                  onValueChange={setQ}
                  placeholder="Type a command or search…"
                  className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-fg-faint"
                />
                <span className="kbd">esc</span>
              </div>
              <Command.List className="max-h-[50vh] overflow-y-auto p-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2">
                <Command.Empty className="px-3 py-10 text-center text-[13px] text-fg-muted">No results. Try another word.</Command.Empty>

                <Command.Group heading="Actions">
                  <Item onSelect={() => run(() => openEditor("new"))} icon={<Plus size={14} />} kbd="⌘N">
                    New note
                  </Item>
                  <Item onSelect={() => run(() => setTheme(theme === "dark" ? "light" : "dark"))} icon={theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}>
                    Switch to {theme === "dark" ? "light" : "dark"} theme
                  </Item>
                  {q.trim() && (
                    <Item
                      onSelect={() =>
                        run(() => {
                          setSearch(q.trim());
                          router.push("/app/notes");
                        })
                      }
                      icon={<Search size={14} />}
                    >
                      Search notes for “{q.trim()}”
                    </Item>
                  )}
                </Command.Group>

                <Command.Group heading="Go to">
                  {NAV.map((n) => (
                    <Item key={n.href} onSelect={() => run(() => router.push(n.href))} icon={<n.icon size={14} />} kbd={n.key}>
                      {n.label}
                    </Item>
                  ))}
                </Command.Group>

                {notes && notes.length > 0 && (
                  <Command.Group heading="Notes">
                    {notes.slice(0, 40).map((n) => (
                      <Item key={n.id} value={`${n.title} ${n.tags.join(" ")} ${n.content.slice(0, 80)}`} onSelect={() => run(() => openEditor(n))} icon={<span className="w-2 h-2 rounded-full" style={{ background: PRI_COLOR[n.priority] }} />}>
                        <span className="truncate">{n.title || "Untitled"}</span>
                        {n.date && <span className="ml-auto text-[12px] text-fg-faint tabular-nums shrink-0">{format(new Date(n.date + "T00:00:00"), "d MMM")}</span>}
                      </Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Item({
  children,
  onSelect,
  icon,
  kbd,
  value,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  icon?: React.ReactNode;
  kbd?: string;
  value?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="relative flex items-center gap-3 h-10 px-3 rounded-lg text-[13.5px] cursor-pointer text-fg-muted data-[selected=true]:bg-brand-soft data-[selected=true]:text-fg"
    >
      <span className="w-5 flex justify-center text-fg-faint [[data-selected=true]_&]:text-brand">{icon}</span>
      <span className="flex-1 flex items-center gap-2 min-w-0">{children}</span>
      {kbd && <span className="kbd">{kbd}</span>}
    </Command.Item>
  );
}
