"use client";

import { useEffect, useRef, useState } from "react";
import { Archive, FileText, HardDriveDownload, HardDriveUpload, Trash2 } from "lucide-react";
import { exportSnapshot, importSnapshot, wipeAll } from "@/lib/db";
import { download, exportPdf, exportZip, type Period } from "@/lib/export";
import { useFiles, useNotes } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import { cn, formatBytes, toISODate } from "@/lib/utils";
import { PageHeader } from "@/components/app/PageHeader";

const PERIODS: { id: Period; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
  { id: "all", label: "Everything" },
];

export default function ExportPage() {
  const notes = useNotes();
  const files = useFiles();
  const { notify } = useUI();
  const [period, setPeriod] = useState<Period>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Export · MindVault";
  }, []);

  const run = async (key: string, fn: () => Promise<number | void>, done: (n: number | void) => string) => {
    setBusy(key);
    try {
      const n = await fn();
      notify(done(n));
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  async function onImport(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    await run(
      "import",
      async () => {
        const json = JSON.parse(await f.text());
        const r = await importSnapshot(json);
        return r.notes;
      },
      (n) => `Imported ${n} notes`,
    );
    if (importRef.current) importRef.current.value = "";
  }

  const size = (files ?? []).reduce((a, f) => a + f.size, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <PageHeader
        eyebrow={`${notes?.length ?? 0} notes · ${files?.length ?? 0} files · ${formatBytes(size)}`}
        title="Export"
        subtitle="Take everything with you. Markdown and files in a ZIP, a printable PDF, or a full backup to move between devices."
      />

      <section className="glass p-5 md:p-6 mb-4">
        <p className="eyebrow mb-4">Period</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {PERIODS.map((p) => (
            <button key={p.id} onClick={() => setPeriod(p.id)} className="pill" data-on={period === p.id}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Action
            icon={<Archive size={18} />}
            title="ZIP archive"
            body="One Markdown file per note, attachments in a files/ folder, plus an index."
            cta="Download ZIP"
            busy={busy === "zip"}
            onClick={() => run("zip", () => exportZip(period), (n) => `ZIP ready · ${n} notes`)}
          />
          <Action
            icon={<FileText size={18} />}
            title="PDF document"
            body="A clean, paginated document with titles, metadata, content and checklists."
            cta="Download PDF"
            busy={busy === "pdf"}
            onClick={() => run("pdf", () => exportPdf(period), (n) => `PDF ready · ${n} notes`)}
          />
        </div>
      </section>

      <section className="glass p-5 md:p-6 mb-4">
        <p className="eyebrow mb-4">Backup & transfer</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Action
            icon={<HardDriveDownload size={18} />}
            title="Full backup"
            body="A single JSON file with every note, file and conversation. Import it on another device."
            cta="Download backup"
            busy={busy === "backup"}
            onClick={() =>
              run(
                "backup",
                async () => {
                  const snap = await exportSnapshot();
                  download(new Blob([JSON.stringify(snap)], { type: "application/json" }), `mindvault-backup-${toISODate(new Date())}.json`);
                  return snap.notes.length;
                },
                (n) => `Backup ready · ${n} notes`,
              )
            }
          />
          <Action
            icon={<HardDriveUpload size={18} />}
            title="Restore backup"
            body="Merge a backup into this vault. Existing notes with the same id are replaced."
            cta="Choose file"
            busy={busy === "import"}
            onClick={() => importRef.current?.click()}
          />
          <input ref={importRef} type="file" accept="application/json" hidden onChange={(e) => onImport(e.target.files)} />
        </div>
      </section>

      <section className="glass p-5 md:p-6 !border-[#f4ddb0]">
        <p className="eyebrow mb-3">Danger zone</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <p className="text-[13px] text-fg-muted max-w-md">Erase every note, file and conversation from this browser. This cannot be undone — download a backup first.</p>
          <button
            className={cn("btn btn-ghost btn-sm shrink-0", confirmWipe && "!border-danger !text-danger")}
            onClick={async () => {
              if (!confirmWipe) return setConfirmWipe(true);
              await wipeAll();
              setConfirmWipe(false);
              notify("Vault erased");
            }}
            onBlur={() => setConfirmWipe(false)}
           
          >
            <Trash2 size={13} /> {confirmWipe ? "Click again to confirm" : "Erase vault"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Action({ icon, title, body, cta, onClick, busy }: { icon: React.ReactNode; title: string; body: string; cta: string; onClick: () => void; busy?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-bg p-4 flex flex-col">
      <div className="w-9 h-9 rounded-xl bg-bg-elev border border-line text-brand inline-flex items-center justify-center mb-3 shadow-[var(--shadow-sm)]">{icon}</div>
      <p className="text-[15px] font-semibold tracking-[-0.01em]">{title}</p>
      <p className="text-[13px] text-fg-muted mt-1 mb-4 flex-1">{body}</p>
      <button className="btn btn-ghost btn-sm w-fit" onClick={onClick} disabled={busy}>
        {busy ? <span className="spinner" /> : cta}
      </button>
    </div>
  );
}
