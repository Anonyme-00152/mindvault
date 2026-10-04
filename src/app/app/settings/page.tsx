"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Check, Database, Share, Smartphone, SquarePlus, Sun, Moon, Wifi, CalendarPlus, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { useUI } from "@/lib/store";
import { useNotes } from "@/lib/hooks";
import {
  badgeSupported,
  currentSubscription,
  disablePush,
  enablePush,
  getLeadMin,
  isIOS,
  isStandalone,
  pushSupported,
  pushWanted,
  requestPersistentStorage,
  serverPushInfo,
  setLeadMin,
  shareSupported,
  showLocalNotification,
  storageInfo,
  syncReminders,
} from "@/lib/pwa";
import { remindersFor } from "@/lib/reminders";
import { cn, formatBytes } from "@/lib/utils";

const LEADS = [0, 5, 10, 15, 30, 60];

export default function SettingsPage() {
  const { theme, setTheme, notify } = useUI();
  const notes = useNotes();
  const [env, setEnv] = useState({ ios: false, standalone: false, push: false, share: false, badge: false, serverPush: false, permission: "default" as NotificationPermission | "unsupported" });
  const [enabled, setEnabled] = useState(false);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [lead, setLead] = useState(10);
  const [busy, setBusy] = useState<string | null>(null);
  const [storage, setStorage] = useState<{ usage: number; quota: number; persisted: boolean | null } | null>(null);

  useEffect(() => {
    document.title = "Settings · MindVault";
    (async () => {
      const info = await serverPushInfo();
      setEnv({
        ios: isIOS(),
        standalone: isStandalone(),
        push: pushSupported(),
        share: shareSupported(),
        badge: badgeSupported(),
        serverPush: info.enabled,
        permission: typeof Notification === "undefined" ? "unsupported" : Notification.permission,
      });
      setLead(getLeadMin());
      const sub = await currentSubscription();
      setEndpoint(sub?.endpoint ?? null);
      setEnabled(Boolean(sub) && pushWanted());
      setStorage(await storageInfo());
    })();
  }, []);

  async function toggleNotifications() {
    setBusy("push");
    try {
      if (enabled) {
        await disablePush();
        setEnabled(false);
        setEndpoint(null);
        notify("Notifications turned off");
      } else {
        const r = await enablePush(lead);
        if (r.ok) {
          setEnabled(true);
          setEndpoint(r.endpoint);
          if (notes) await syncReminders(notes);
          notify("Notifications on — reminders will reach this device");
        } else notify(r.reason);
        setEnv((e) => ({ ...e, permission: typeof Notification === "undefined" ? "unsupported" : Notification.permission }));
      }
    } finally {
      setBusy(null);
    }
  }

  async function testLocal() {
    setBusy("local");
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      const p = await Notification.requestPermission();
      setEnv((e) => ({ ...e, permission: p }));
      if (p !== "granted") {
        setBusy(null);
        return notify("Permission not granted");
      }
    }
    const ok = await showLocalNotification({ title: "MindVault", body: "This is what a reminder looks like here.", url: "/app/settings", tag: "test-local" });
    notify(ok ? "Local notification sent" : "Could not show a notification");
    setBusy(null);
  }

  async function testPush() {
    if (!endpoint) return notify("Turn notifications on first");
    setBusy("test");
    try {
      const r = await fetch("/api/push/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint }) });
      const j = await r.json().catch(() => ({}));
      notify(r.ok ? "Push sent — it should appear within a few seconds, even with the app closed" : (j.error ?? "Push failed"));
    } finally {
      setBusy(null);
    }
  }

  async function changeLead(v: number) {
    setLead(v);
    setLeadMin(v);
    if (notes && enabled) await syncReminders(notes);
    notify(`Reminders ${v === 0 ? "at the note time" : `${v} min before`}`);
  }

  const upcoming = notes ? remindersFor(notes, lead) : [];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <PageHeader
        eyebrow={env.ios ? (env.standalone ? "iPhone · installed app" : "iPhone · Safari") : env.standalone ? "Installed app" : "Browser"}
        title="Settings"
        subtitle="Your phone, your reminders, your data — everything that connects MindVault to the device you're on."
      />

      {/* Install */}
      {!env.standalone && (
        <Section icon={<Smartphone size={16} />} title="Install on your phone" body={env.ios ? "On iPhone, notifications only work from the installed app." : "Get an app icon, full screen and offline access."}>
          {env.ios ? (
            <ol className="text-[13px] text-fg-muted space-y-2 list-decimal pl-5">
              <li>
                Tap <Share size={12} className="inline -mt-0.5" /> <b className="text-fg">Share</b> in Safari&apos;s toolbar.
              </li>
              <li>
                Choose <SquarePlus size={12} className="inline -mt-0.5" /> <b className="text-fg">Add to Home Screen</b>, then <b className="text-fg">Add</b>.
              </li>
              <li>Open MindVault from the Home Screen and come back here to turn notifications on.</li>
            </ol>
          ) : (
            <p className="text-[13px] text-fg-muted">Use your browser&apos;s <b className="text-fg">Install app</b> option (address bar or menu). On Android Chrome: menu → Add to Home screen.</p>
          )}
        </Section>
      )}

      {/* Notifications */}
      <Section
        icon={<Bell size={16} />}
        title="Reminders & notifications"
        body="A notification before each timed note — on this device while the app is open, and pushed to your phone when it's closed."
        right={
          <button className={cn("btn btn-sm", enabled ? "btn-solid" : "btn-ghost")} onClick={toggleNotifications} disabled={busy === "push" || !env.push}>
            {busy === "push" ? <span className="spinner" /> : enabled ? <><Check size={13} /> On</> : "Turn on"}
          </button>
        }
      >
        <div className="grid sm:grid-cols-2 gap-3 text-[12.5px]">
          <Fact ok={env.push} label="Browser supports push" />
          <Fact ok={env.serverPush} label="Server configured (VAPID)" hint={!env.serverPush ? "Add VAPID keys to .env" : undefined} />
          <Fact ok={env.permission === "granted"} label={`Permission: ${env.permission}`} />
          <Fact ok={!env.ios || env.standalone} label={env.ios ? "Installed on Home Screen" : "Not iOS — no install needed"} />
        </div>

        <div className="mt-5">
          <p className="eyebrow mb-2">Remind me</p>
          <div className="flex flex-wrap gap-2">
            {LEADS.map((v) => (
              <button key={v} onClick={() => changeLead(v)} className="pill" data-on={lead === v}>
                {v === 0 ? "At the time" : `${v} min before`}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn btn-ghost btn-sm" onClick={testLocal} disabled={busy === "local"}>
            <BellRing size={13} /> Test on this device
          </button>
          <button className="btn btn-ghost btn-sm" onClick={testPush} disabled={busy === "test" || !enabled}>
            <Wifi size={13} /> Send a real push
          </button>
        </div>

        {upcoming.length > 0 && (
          <div className="mt-5">
            <p className="eyebrow mb-2">Upcoming</p>
            <ul className="space-y-1.5">
              {upcoming.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between text-[13px]">
                  <span className="truncate">{r.title}</span>
                  <span className="text-[12px] tabular-nums text-fg-faint shrink-0 ml-3">{new Date(r.at).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-5 text-[12px] text-fg-faint leading-relaxed flex gap-2">
          <ShieldCheck size={13} className="shrink-0 mt-0.5" />
          Only the note title and time leave this device, and only when notifications are on. Turn them off to erase that list from the server.
        </p>
      </Section>

      {/* Calendar */}
      <Section icon={<CalendarPlus size={16} />} title="Calendar" body="Every dated note has an “Add to Calendar” button. On iPhone it opens the Calendar app directly; Google Calendar is one tap away too. After you save a dated note, MindVault offers it automatically.">
        <p className="text-[13px] text-fg-muted">Events are created with a {lead}-minute alert so both the calendar and MindVault remind you.</p>
      </Section>

      {/* Device */}
      <Section icon={<Database size={16} />} title="This device" body="Where your data lives and what the OS lets us do.">
        <div className="grid sm:grid-cols-2 gap-3 text-[12.5px]">
          <Fact ok={true} label="Data stored in IndexedDB" hint={storage ? `${formatBytes(storage.usage)} used` : undefined} />
          <Fact ok={storage?.persisted === true} label={storage?.persisted ? "Persistent storage granted" : "Storage may be evicted"} hint={storage?.persisted ? undefined : "Ask the browser to keep it"} />
          <Fact ok={env.share} label="Share sheet" hint={env.share ? "Share button in every note" : "Copies to clipboard instead"} />
          <Fact ok={env.badge} label="App icon badge" hint={env.badge ? "Shows today's notes" : "Not supported here"} />
        </div>
        {storage && storage.persisted !== true && (
          <button
            className="btn btn-ghost btn-sm mt-4"
            onClick={async () => {
              const ok = await requestPersistentStorage();
              setStorage(await storageInfo());
              notify(ok ? "Storage is now persistent" : "The browser declined — install the app to make it persistent");
            }}
           
          >
            Keep my data
          </button>
        )}
      </Section>

      {/* Theme */}
      <Section icon={theme === "dark" ? <Moon size={16} /> : <Sun size={16} />} title="Appearance" body="Light by default. A dark theme is available if you prefer it.">
        <div className="flex gap-2">
          {(["light", "dark"] as const).map((t) => (
            <button key={t} onClick={() => setTheme(t)} className="pill capitalize" data-on={theme === t}>
              {t}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ icon, title, body, right, children }: { icon: React.ReactNode; title: string; body: string; right?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="glass p-5 md:p-6 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-9 h-9 rounded-xl bg-brand-soft text-brand inline-flex items-center justify-center shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
          <p className="text-[13px] text-fg-muted mt-1 leading-relaxed">{body}</p>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Fact({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-line bg-bg px-3 py-2.5">
      <span className={cn("mt-1 w-2 h-2 rounded-full shrink-0", ok ? "bg-ok" : "bg-warn")} />
      <div className="min-w-0">
        <p className="text-fg">{label}</p>
        {hint && <p className="text-fg-faint text-[11.5px]">{hint}</p>}
      </div>
    </div>
  );
}
