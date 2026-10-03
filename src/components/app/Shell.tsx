"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  Download,
  FolderOpen,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  StickyNote,
  Sun,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Cursor } from "@/components/Cursor";
import { CommandPalette } from "./CommandPalette";
import { NoteEditor } from "./NoteEditor";
import { InstallBanner } from "./InstallBanner";
import { db, ensureClean } from "@/lib/db";
import { registerSW, runLocalScheduler, setBadge, syncReminders } from "@/lib/pwa";
import { useUI } from "@/lib/store";
import { useHotkey, useNotes } from "@/lib/hooks";
import { cn, isMac, toISODate } from "@/lib/utils";

export const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutGrid, key: "1" },
  { href: "/app/notes", label: "Notes", icon: StickyNote, key: "2" },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays, key: "3" },
  { href: "/app/ask", label: "Ask", icon: Sparkles, key: "4" },
  { href: "/app/files", label: "Files", icon: FolderOpen, key: "5" },
  { href: "/app/export", label: "Export", icon: Download, key: "6" },
  { href: "/app/settings", label: "Settings", icon: Settings, key: "7" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const { theme, setTheme, setPaletteOpen, openEditor, editing, editorSeq, toast, dismissToast, search, setSearch } = useUI();
  const notes = useNotes();
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    ensureClean();
    registerSW();
    const t = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    useUI.setState({ theme: t });
  }, []);

  // Deep links used by notifications and home-screen shortcuts: ?open=<id>, ?new=1
  useEffect(() => {
    const open = params.get("open");
    const isNew = params.get("new");
    if (!open && !isNew) return;
    (async () => {
      if (open) {
        const n = await db.notes.get(open);
        if (n) openEditor(n);
      } else if (isNew) openEditor("new");
      router.replace(pathname);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Reminders: keep the server copy in sync, fire due ones while the app is open, badge the icon.
  useEffect(() => {
    if (!notes) return;
    const sync = setTimeout(() => syncReminders(notes), 800);
    runLocalScheduler(notes);
    const today = toISODate(new Date());
    setBadge(notes.filter((n) => n.date === today).length);
    const iv = setInterval(() => runLocalScheduler(notes), 30_000);
    return () => {
      clearTimeout(sync);
      clearInterval(iv);
    };
  }, [notes]);

  useHotkey(
    "mod+k",
    useCallback(() => setPaletteOpen(true), [setPaletteOpen]),
  );
  useHotkey(
    "mod+n",
    useCallback(() => {
      if (!useUI.getState().editing) openEditor("new");
    }, [openEditor]),
  );

  // Plain digits 1–6 jump between sections (the hints shown next to nav items).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (useUI.getState().editing || useUI.getState().paletteOpen) return;
      const item = NAV.find((n) => n.key === e.key);
      if (item) router.push(item.href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const todayCount = notes?.filter((n) => n.date === toISODate(new Date())).length ?? 0;

  // Drawer open on a phone: freeze the page behind it so only the drawer scrolls.
  useEffect(() => {
    document.body.classList.toggle("scroll-lock", mobileNav);
    return () => document.body.classList.remove("scroll-lock");
  }, [mobileNav]);
  useEffect(() => setMobileNav(false), [pathname]);

  return (
    <div className="h-dvh flex bg-bg text-fg overflow-hidden">
      <Cursor />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-[min(300px,85vw)] lg:w-[260px] shrink-0 flex flex-col border-r border-line bg-bg-elev lg:bg-transparent transition-transform duration-500 drawer-scroll",
          mobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        style={{ transitionTimingFunction: "var(--ease)", paddingTop: "var(--sat)", paddingBottom: "var(--sab)", paddingLeft: "var(--sal)" }}
      >
        <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-line">
          <Link href="/app" data-cursor="hover">
            <Logo />
          </Link>
          <button className="btn-icon lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close menu">
            <X size={16} />
          </button>
        </div>

        <div className="p-3">
          <div className="glass p-4 mb-2">
            <p className="eyebrow mb-2">Today</p>
            <p className="display text-4xl text-grad">{todayCount}</p>
            <p className="text-[12px] text-fg-muted mt-1">{todayCount === 1 ? "note scheduled" : "notes scheduled"}</p>
          </div>
        </div>

        <nav className="px-3 py-1 space-y-0.5 flex-1">
          {NAV.map((item) => {
            const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNav(false)}
                className={cn(
                  "relative flex items-center gap-3 h-10 px-3 rounded-xl text-[14px] transition-colors",
                  active ? "text-fg" : "text-fg-muted hover:text-fg hover:bg-glass",
                )}
                data-cursor="hover"
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-glass-hover border border-line before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-grad"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <item.icon size={16} className={cn("relative", active && "text-brand")} />
                <span className="relative flex-1">{item.label}</span>
                <span className="kbd relative hidden lg:inline-flex">{item.key}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-line shrink-0">
          <div className="glass p-3 text-[12px] text-fg-muted leading-relaxed">
            <p className="inline-flex items-center gap-2 text-fg">
              <span className="w-1.5 h-1.5 rounded-full bg-ok pulse-dot" /> 100% local
            </p>
            <p className="mt-1">Nothing leaves this browser.</p>
          </div>
          <button onClick={logout} className="mt-2 w-full flex items-center gap-3 h-10 px-3 rounded-xl text-[14px] text-fg-muted hover:text-fg hover:bg-glass transition-colors" data-cursor="hover">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {mobileNav && <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileNav(false)} aria-hidden />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="shrink-0 flex items-center gap-3 px-4 md:px-6 border-b border-line" style={{ paddingTop: "var(--sat)", paddingRight: "calc(1rem + var(--sar))", height: "calc(4rem + var(--sat))" }}>
          <button className="btn-icon lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex-1 min-w-0 max-w-xl h-10 flex items-center gap-3 px-3.5 rounded-xl border border-line bg-glass text-[13px] text-fg-faint hover:border-line-strong transition-colors"
            data-cursor="hover"
          >
            <Search size={14} />
            <span className="flex-1 text-left truncate">{search ? <span className="text-fg">{search}</span> : "Search notes, tasks, tags…"}</span>
            {search && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearch("");
                }}
                className="text-fg-muted hover:text-fg"
              >
                <X size={13} />
              </span>
            )}
            <span className="kbd max-sm:!hidden">{isMac ? "⌘" : "Ctrl"} K</span>
          </button>
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <button className="btn-icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme" data-cursor="hover">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="btn btn-solid btn-sm" onClick={() => openEditor("new")} data-cursor="hover">
              <Plus size={14} /> <span className="hidden sm:inline">New note</span>
            </button>
          </div>
        </header>

        <main className="app-scroll flex-1 overflow-y-auto overflow-x-clip">
          {/* Enter-only page transition. An exit animation via AnimatePresence conflicts with
              the App Router: the incoming page inherited the outgoing page's exit styles. */}
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <InstallBanner />
      <CommandPalette />
      <AnimatePresence>{editing && <NoteEditor key={`editor-${editorSeq}`} />}</AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            style={{ bottom: "calc(1.5rem + var(--sab))" }}
            className="fixed left-1/2 -translate-x-1/2 z-[60] max-w-[calc(100vw-32px)] glass !bg-bg-elev !border-brand/40 pl-4 pr-2 h-11 flex items-center gap-3 text-[13px] shadow-2xl before:w-1.5 before:h-1.5 before:rounded-full before:bg-grad before:shrink-0"
          >
            <span className="truncate">{toast.text}</span>
            {toast.action && (
              <button
                className="btn btn-solid btn-sm !h-8 shrink-0"
                onClick={() => {
                  toast.action?.onClick();
                  dismissToast();
                }}
                data-cursor="hover"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
