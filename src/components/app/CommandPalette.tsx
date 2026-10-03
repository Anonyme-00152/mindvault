"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon, Plus, Search, Sun } from "lucide-react";
import { NAV } from "./Shell";
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPaletteOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl glass !bg-bg-elev shadow-2xl overflow-hidden"
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
                <Command.Empty className="px-3 py-8 text-center text-[13px] text-fg-muted">No results.</Command.Empty>

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
                      <Item key={n.id} value={`${n.title} ${n.tags.join(" ")} ${n.content.slice(0, 80)}`} onSelect={() => run(() => openEditor(n))} icon={<span className="chip !h-5 !px-1.5" data-p={n.priority}>{n.priority[0]}</span>}>
                        <span className="truncate">{n.title || "Untitled"}</span>
                        {n.date && <span className="ml-auto font-mono text-[10px] text-fg-faint">{n.date}</span>}
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
      className="relative flex items-center gap-3 h-10 px-3 rounded-lg text-[13.5px] cursor-pointer text-fg-muted data-[selected=true]:bg-glass-hover data-[selected=true]:text-fg data-[selected=true]:before:absolute data-[selected=true]:before:left-0 data-[selected=true]:before:top-2 data-[selected=true]:before:bottom-2 data-[selected=true]:before:w-[3px] data-[selected=true]:before:rounded-full data-[selected=true]:before:bg-grad"
    >
      <span className="w-5 flex justify-center text-fg-faint">{icon}</span>
      <span className="flex-1 flex items-center gap-2 min-w-0">{children}</span>
      {kbd && <span className="kbd">{kbd}</span>}
    </Command.Item>
  );
}
