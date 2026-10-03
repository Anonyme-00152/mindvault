"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup } from "motion/react";
import { LayoutGrid, List, X } from "lucide-react";
import { useFiles, useNotes } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import { CATEGORIES, CATEGORY_LABEL, PRIORITIES, type Category, type Priority } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NoteCard } from "@/components/app/NoteCard";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";

type Sort = "updated" | "date" | "priority";
const P_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function NotesPage() {
  const notes = useNotes();
  const files = useFiles();
  const { openEditor, search, setSearch } = useUI();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [cat, setCat] = useState<Category | "all">("all");
  const [pri, setPri] = useState<Priority | "all">("all");
  const [sort, setSort] = useState<Sort>("updated");

  useEffect(() => {
    document.title = "Notes · MindVault";
    try {
      const v = localStorage.getItem("mv-notes-view");
      if (v === "list" || v === "grid") setView(v);
    } catch {}
  }, []);

  const setViewPersist = (v: "grid" | "list") => {
    setView(v);
    try {
      localStorage.setItem("mv-notes-view", v);
    } catch {}
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = notes ?? [];
    if (cat !== "all") list = list.filter((n) => n.category === cat);
    if (pri !== "all") list = list.filter((n) => n.priority === pri);
    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.includes(q.replace(/^#/, ""))) ||
          n.checklist.some((c) => c.text.toLowerCase().includes(q)),
      );
    }
    const sorted = [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "priority") return P_RANK[a.priority] - P_RANK[b.priority];
      if (sort === "date") return (a.date ?? "9999").localeCompare(b.date ?? "9999");
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return sorted;
  }, [notes, cat, pri, sort, search]);

  const tags = useMemo(() => {
    const m = new Map<string, number>();
    (notes ?? []).forEach((n) => n.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [notes]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <PageHeader
        eyebrow={`${filtered.length} of ${notes?.length ?? 0}`}
        title={
          <>
            Notes<span className="serif-i text-brand">.</span>
          </>
        }
        actions={
          <>
            <div className="flex rounded-full border border-line p-0.5">
              <button className={cn("btn-icon !rounded-full", view === "grid" && "!bg-glass-hover !text-fg")} onClick={() => setViewPersist("grid")} aria-label="Grid view" data-cursor="hover">
                <LayoutGrid size={15} />
              </button>
              <button className={cn("btn-icon !rounded-full", view === "list" && "!bg-glass-hover !text-fg")} onClick={() => setViewPersist("list")} aria-label="List view" data-cursor="hover">
                <List size={15} />
              </button>
            </div>
            <select className="field !w-auto !h-9 text-[13px]" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
              <option value="updated">Recently updated</option>
              <option value="date">By date</option>
              <option value="priority">By priority</option>
            </select>
            <button className="btn btn-solid btn-sm" onClick={() => openEditor("new")} data-cursor="hover">
              New note
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Pill active={cat === "all"} onClick={() => setCat("all")}>
          All
        </Pill>
        {CATEGORIES.map((c) => (
          <Pill key={c} active={cat === c} onClick={() => setCat(c)}>
            {CATEGORY_LABEL[c]}
          </Pill>
        ))}
        <span className="w-px h-5 bg-line mx-1 hidden sm:block" />
        {PRIORITIES.map((p) => (
          <button key={p} onClick={() => setPri(pri === p ? "all" : p)} className={cn("chip !h-8 !px-3 transition-colors", pri === p && "!bg-accent !text-accent-fg !border-accent")} data-p={pri === p ? undefined : p} data-cursor="hover">
            {p}
          </button>
        ))}
        {search && (
          <button onClick={() => setSearch("")} className="chip !h-8 !px-3 !text-fg" data-cursor="hover">
            “{search}” <X size={11} />
          </button>
        )}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-8">
          {tags.map(([t, n]) => (
            <button key={t} onClick={() => setSearch(search === `#${t}` ? "" : `#${t}`)} className={cn("chip hover:!text-fg transition-colors", search === `#${t}` && "!text-fg !border-line-strong")} data-cursor="hover">
              #{t} <span className="opacity-50">{n}</span>
            </button>
          ))}
        </div>
      )}

      {notes === null ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search || cat !== "all" || pri !== "all" ? "No notes match" : "Your vault is empty"}
          body={search || cat !== "all" || pri !== "all" ? "Try clearing a filter." : "Create your first note and it will appear here."}
          action={
            search || cat !== "all" || pri !== "all"
              ? {
                  label: "Clear filters",
                  onClick: () => {
                    setSearch("");
                    setCat("all");
                    setPri("all");
                  },
                }
              : { label: "New note", onClick: () => openEditor("new") }
          }
        />
      ) : (
        <LayoutGroup>
          <div className={cn(view === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-3" : "flex flex-col gap-2")}>
            <AnimatePresence mode="popLayout">
              {filtered.map((n, i) => (
                <NoteCard key={n.id} note={n} files={files} compact={view === "list"} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      )}
    </div>
  );
}

function Pill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("h-8 px-3.5 rounded-full text-[13px] border transition-colors", active ? "bg-accent text-accent-fg border-accent" : "border-line text-fg-muted hover:text-fg hover:border-line-strong")} data-cursor="hover">
      {children}
    </button>
  );
}
