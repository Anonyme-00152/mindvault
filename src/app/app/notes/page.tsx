"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup } from "motion/react";
import { LayoutGrid, List, Plus, Search, X } from "lucide-react";
import { useFiles, useNotes } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import { CATEGORIES, CATEGORY_LABEL, PRIORITIES, type Category, type Priority } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NoteCard, PRI_COLOR } from "@/components/app/NoteCard";
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

  const catCount = useMemo(() => {
    const m = new Map<string, number>();
    (notes ?? []).forEach((n) => m.set(n.category, (m.get(n.category) ?? 0) + 1));
    return m;
  }, [notes]);

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
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "priority") return P_RANK[a.priority] - P_RANK[b.priority];
      if (sort === "date") return (a.date ?? "9999").localeCompare(b.date ?? "9999");
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [notes, cat, pri, sort, search]);

  const tags = useMemo(() => {
    const m = new Map<string, number>();
    (notes ?? []).forEach((n) => n.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [notes]);

  const filtering = !!search || cat !== "all" || pri !== "all";
  const clearAll = () => {
    setSearch("");
    setCat("all");
    setPri("all");
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-7 md:py-9">
      <PageHeader
        title="Notes"
        subtitle={notes === null ? "Loading…" : filtering ? `${filtered.length} of ${notes.length} notes match your filters.` : `${notes.length} note${notes.length === 1 ? "" : "s"} in your vault.`}
        actions={
          <button className="btn btn-solid btn-sm" onClick={() => openEditor("new")}>
            <Plus size={14} /> New note
          </button>
        }
      />

      {/* Toolbar */}
      <div className="card p-2 mb-4 flex flex-col md:flex-row md:items-center gap-2">
        <label className="flex items-center gap-2 h-9 px-2.5 rounded-lg flex-1 min-w-0 focus-within:bg-glass-hover transition-colors">
          <Search size={15} className="text-fg-faint shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title, content, task or #tag"
            className="flex-1 min-w-0 bg-transparent outline-none text-[14px] placeholder:text-fg-faint"
            aria-label="Filter notes"
          />
          {search && (
            <button onClick={() => setSearch("")} className="btn-icon !w-7 !h-7" aria-label="Clear filter">
              <X size={13} />
            </button>
          )}
        </label>
        <div className="flex items-center gap-2 shrink-0">
          <select className="field !w-auto !h-9 !text-[13px] !shadow-none" value={pri} onChange={(e) => setPri(e.target.value as Priority | "all")} aria-label="Priority">
            <option value="all">Any priority</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
          <select className="field !w-auto !h-9 !text-[13px] !shadow-none" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
            <option value="updated">Last edited</option>
            <option value="date">Due date</option>
            <option value="priority">Priority</option>
          </select>
          <div className="seg ml-auto md:ml-0" role="group" aria-label="View">
            <button data-on={view === "grid"} onClick={() => setViewPersist("grid")} aria-label="Grid view" aria-pressed={view === "grid"}>
              <LayoutGrid size={14} />
            </button>
            <button data-on={view === "list"} onClick={() => setViewPersist("list")} aria-label="List view" aria-pressed={view === "list"}>
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap mb-3 [scrollbar-width:none]">
        <button className="pill" data-on={cat === "all"} onClick={() => setCat("all")}>
          All <span className="opacity-60 tabular-nums">{notes?.length ?? 0}</span>
        </button>
        {CATEGORIES.filter((c) => catCount.get(c)).map((c) => (
          <button key={c} className="pill" data-on={cat === c} onClick={() => setCat(cat === c ? "all" : c)}>
            {CATEGORY_LABEL[c]} <span className="opacity-60 tabular-nums">{catCount.get(c)}</span>
          </button>
        ))}
        {pri !== "all" && (
          <button className="pill" data-on onClick={() => setPri("all")}>
            <span className="w-2 h-2 rounded-full" style={{ background: PRI_COLOR[pri] }} />
            {pri} <X size={12} />
          </button>
        )}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {tags.map(([t, n]) => {
            const on = search === `#${t}`;
            return (
              <button
                key={t}
                onClick={() => setSearch(on ? "" : `#${t}`)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-[12.5px] font-medium transition-colors",
                  on ? "bg-brand text-white" : "bg-brand-soft text-brand hover:bg-brand-line",
                )}
              >
                #{t} <span className="opacity-60 tabular-nums">{n}</span>
              </button>
            );
          })}
        </div>
      )}

      {notes === null ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-44" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={filtering ? "No notes match" : "Your vault is empty"}
          body={filtering ? "Try a different word or clear the filters." : "Create your first note and it will appear here."}
          action={filtering ? { label: "Clear filters", onClick: clearAll } : { label: "New note", onClick: () => openEditor("new") }}
        />
      ) : (
        <LayoutGroup>
          <div className={cn(view === "grid" ? "grid sm:grid-cols-2 xl:grid-cols-3 gap-3" : "flex flex-col gap-2")}>
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
