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
import { BrandMark } from "@/components/site/Brand";
import { CommandPalette } from "./CommandPalette";
import { NoteEditor } from "./NoteEditor";
import { InstallBanner } from "./InstallBanner";
import { db, ensureClean } from "@/lib/db";
import { registerSW, runLocalScheduler, setBadge, syncReminders } from "@/lib/pwa";
import { useUI } from "@/lib/store";
import { useFiles, useHotkey, useNotes } from "@/lib/hooks";
import { cn, formatBytes, isMac, toISODate } from "@/lib/utils";

export const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutGrid, key: "1" },
  { href: "/app/notes", label: "Notes", icon: StickyNote, key: "2" },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays, key: "3" },
  { href: "/app/ask", label: "Ask", icon: Sparkles, key: "4" },
  { href: "/app/files", label: "Files", icon: FolderOpen, key: "5" },
  { href: "/app/export", label: "Export", icon: Download, key: "6" },
  { href: "/app/settings", label: "Settings", icon: Settings, key: "7" },
];

const isActive = (pathname: string, href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const { theme, setTheme, setPaletteOpen, openEditor, editing, editorSeq, toast, dismissToast, search, setSearch } = useUI();
  const notes = useNotes();
  const files = useFiles();
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    ensureClean();
    registerSW();
    const t = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
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

  // Plain digits 1–7 jump between sections (the hints shown next to nav items).
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

  const today = toISODate(new Date());
  const counts: Record<string, number | undefined> = {
    "/app/notes": notes?.length,
    "/app/calendar": notes?.filter((n) => n.date === today).length || undefined,
    "/app/files": files?.length || undefined,
  };
  const used = (files ?? []).reduce((a, f) => a + f.size, 0);
  const current = NAV.find((n) => isActive(pathname, n.href));

  // Drawer open on a phone: freeze the page behind it so only the drawer scrolls.
  useEffect(() => {
    document.body.classList.toggle("scroll-lock", mobileNav);
    return () => document.body.classList.remove("scroll-lock");
  }, [mobileNav]);
  useEffect(() => setMobileNav(false), [pathname]);

  const navLink = (item: (typeof NAV)[number]) => {
    const active = isActive(pathname, item.href);
    const count = counts[item.href];
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileNav(false)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13.5px] transition-colors",
          active ? "text-fg font-medium" : "text-fg-muted hover:text-fg hover:bg-glass-hover",
        )}
      >
        {active && (
          <motion.span
            layoutId="nav-active"
            className="absolute inset-0 rounded-lg bg-bg-elev border border-line shadow-[var(--shadow-card)]"
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          />
        )}
        <item.icon size={16} className={cn("relative shrink-0", active ? "text-brand" : "text-fg-faint group-hover:text-fg-muted")} />
        <span className="relative flex-1">{item.label}</span>
        {count !== undefined && <span className="relative text-[11.5px] tabular-nums text-fg-faint lg:group-hover:hidden">{count}</span>}
        <span className="kbd relative hidden lg:group-hover:inline-flex">{item.key}</span>
      </Link>
    );
  };

  return (
    <div className="h-dvh flex bg-bg text-fg overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-[min(300px,86vw)] lg:w-[252px] shrink-0 flex flex-col border-r border-line bg-bg-sidebar transition-transform duration-500",
          mobileNav ? "translate-x-0 shadow-[var(--shadow-pop)]" : "-translate-x-full lg:translate-x-0",
        )}
        style={{ transitionTimingFunction: "var(--ease)", paddingTop: "var(--sat)", paddingBottom: "var(--sab)", paddingLeft: "var(--sal)" }}
        aria-label="Sidebar"
      >
        <div className="h-14 shrink-0 flex items-center justify-between px-3">
          <Link href="/app" className="flex items-center gap-2.5 h-10 px-1.5 rounded-lg min-w-0">
            <BrandMark size={26} />
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold tracking-[-0.01em] leading-tight">MindVault</span>
              <span className="block text-[11.5px] text-fg-faint leading-tight">Personal vault</span>
            </span>
          </Link>
          <button className="btn-icon lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close menu">
            <X size={17} />
          </button>
        </div>

        <div className="px-3 pt-1 pb-3 space-y-2">
          <button className="btn btn-solid w-full !h-9 !text-[13.5px] !justify-between !px-3" onClick={() => openEditor("new")}>
            <span className="inline-flex items-center gap-2">
              <Plus size={15} /> New note
            </span>
            <span className="text-[11px] opacity-60 font-mono">{isMac ? "⌘" : "Ctrl "}N</span>
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full h-9 flex items-center gap-2.5 px-2.5 rounded-lg border border-line bg-bg-elev text-[13px] text-fg-faint hover:text-fg-muted hover:border-line-strong transition-colors shadow-[var(--shadow-sm)]"
          >
            <Search size={14} />
            <span className="flex-1 text-left">Search</span>
            <span className="kbd">{isMac ? "⌘" : "Ctrl"} K</span>
          </button>
        </div>

        <nav className="flex-1 px-3 pb-3 overflow-y-auto drawer-scroll" aria-label="Main">
          <p className="px-2.5 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-faint">Workspace</p>
          <div className="space-y-0.5">{NAV.slice(0, 5).map(navLink)}</div>
          <p className="px-2.5 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-faint">Data</p>
          <div className="space-y-0.5">{NAV.slice(5).map(navLink)}</div>
        </nav>

        <div className="p-3 shrink-0 space-y-2">
          <div className="rounded-xl border border-line bg-bg-elev p-3 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 text-[12.5px] font-medium">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-ok pulse-dot" />
                <span className="relative w-2 h-2 rounded-full bg-ok" />
              </span>
              Stored on this device
            </div>
            <div className="mt-2.5 h-1.5 rounded-full bg-glass-hover overflow-hidden">
              <div className="h-full rounded-full bg-grad" style={{ width: `${Math.min(100, Math.max(4, (used / (200 * 1024 * 1024)) * 100))}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-fg-faint tabular-nums">
              {notes?.length ?? 0} notes · {formatBytes(used)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="btn-icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              title={theme === "dark" ? "Light theme" : "Dark theme"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={logout} className="flex-1 flex items-center gap-2 h-9 px-2.5 rounded-lg text-[13px] text-fg-muted hover:text-fg hover:bg-glass-hover transition-colors">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {mobileNav && (
          <motion.div
            className="fixed inset-0 z-30 bg-overlay backdrop-blur-[2px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileNav(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* ── Main column ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="shrink-0 flex items-center gap-2 px-3 md:px-6 border-b border-line bg-bg"
          style={{ paddingTop: "var(--sat)", paddingRight: "calc(0.75rem + var(--sar))", height: "calc(3.5rem + var(--sat))" }}
        >
          <button className="btn-icon lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 min-w-0 text-[13.5px]">
            <span className="text-fg-faint hidden sm:inline">MindVault</span>
            <span className="text-fg-faint hidden sm:inline">/</span>
            <span className="font-medium truncate">{current?.label ?? "Vault"}</span>
          </div>

          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            {search && (
              <button onClick={() => setSearch("")} className="pill !h-8 max-w-[160px]" title="Clear search">
                <Search size={12} />
                <span className="truncate">{search}</span>
                <X size={12} />
              </button>
            )}
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden md:flex w-72 shrink-0 whitespace-nowrap h-9 items-center gap-2.5 px-3 rounded-lg border border-line bg-bg-elev text-[13px] text-fg-faint hover:border-line-strong transition-colors shadow-[var(--shadow-sm)]"
            >
              <Search size={14} />
              <span className="flex-1 text-left">Search notes, tasks, tags…</span>
              <span className="kbd">{isMac ? "⌘" : "Ctrl"} K</span>
            </button>
            <button className="btn-icon md:hidden" onClick={() => setPaletteOpen(true)} aria-label="Search">
              <Search size={17} />
            </button>
            <button className="btn btn-solid btn-sm hidden sm:inline-flex lg:hidden" onClick={() => openEditor("new")}>
              <Plus size={14} /> New
            </button>
          </div>
        </header>

        <main className="app-scroll flex-1 overflow-y-auto overflow-x-clip">
          {/* Enter-only page transition. An exit animation via AnimatePresence conflicts with
              the App Router: the incoming page inherited the outgoing page's exit styles. */}
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>

        {/* Phone tab bar */}
        <nav className="lg:hidden shrink-0 grid grid-cols-5 border-t border-line bg-bg-elev" style={{ paddingBottom: "var(--sab)" }} aria-label="Tabs">
          {[NAV[0], NAV[1]].map((item) => (
            <TabLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
          <div className="flex items-center justify-center">
            <button
              onClick={() => openEditor("new")}
              className="w-11 h-11 rounded-2xl bg-accent text-accent-fg inline-flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(17,19,24,0.5)] active:scale-95 transition-transform"
              aria-label="New note"
            >
              <Plus size={20} />
            </button>
          </div>
          {[NAV[2], NAV[3]].map((item) => (
            <TabLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>
      </div>

      <InstallBanner />
      <CommandPalette />
      <AnimatePresence>{editing && <NoteEditor key={`editor-${editorSeq}`} />}</AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed inset-x-0 z-[80] flex justify-center pointer-events-none bottom-[calc(5.25rem+var(--sab))] lg:bottom-6"
          >
            <div className="pointer-events-auto max-w-[calc(100vw-32px)] rounded-xl bg-[#16181d] text-white pl-3.5 pr-1.5 h-11 flex items-center gap-3 text-[13.5px] shadow-[var(--shadow-pop)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7cf2c4] shrink-0" />
              <span className="truncate">{toast.text}</span>
              {toast.action ? (
                <button
                  className="h-8 px-3 rounded-lg bg-white text-[#111318] text-[13px] font-medium shrink-0"
                  onClick={() => {
                    toast.action?.onClick();
                    dismissToast();
                  }}
                >
                  {toast.action.label}
                </button>
              ) : (
                <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-white/60 hover:text-white" onClick={dismissToast} aria-label="Dismiss">
                  <X size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabLink({ item, active }: { item: (typeof NAV)[number]; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn("h-14 flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium transition-colors", active ? "text-brand" : "text-fg-faint")}
    >
      <item.icon size={20} strokeWidth={active ? 2.2 : 1.8} />
      {item.label}
    </Link>
  );
}
