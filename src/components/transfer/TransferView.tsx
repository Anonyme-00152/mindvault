import React, { useState, useRef } from 'react';
import {
  ArrowRightLeft, Download, Upload, CheckCircle, AlertCircle,
  FileJson, RefreshCw, ShieldCheck, Info
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '../../store/AppContext';
import type { Note } from '../../types';

// ─── Validation basique d'un objet Note importé ──────────────────────────────
function isValidNote(obj: unknown): obj is Note {
  if (typeof obj !== 'object' || obj === null) return false;
  const n = obj as Record<string, unknown>;
  return (
    typeof n.id === 'string' &&
    typeof n.title === 'string' &&
    typeof n.content === 'string' &&
    typeof n.priority === 'string' &&
    typeof n.category === 'string' &&
    Array.isArray(n.checklist) &&
    Array.isArray(n.files) &&
    Array.isArray(n.tags)
  );
}

// ─── Format de sauvegarde ─────────────────────────────────────────────────────
interface BackupFile {
  version: string;
  app: string;
  exportDate: string;
  totalNotes: number;
  notes: Note[];
}

export function TransferView() {
  const { notes, importData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [loading, setLoading] = useState<'export' | 'import' | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ count: number; date: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 5000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setSuccess('');
  };

  // ─── EXPORT ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    setLoading('export');
    setError('');
    try {
      const backup: BackupFile = {
        version: '1.0',
        app: 'MindVault',
        exportDate: new Date().toISOString(),
        totalNotes: notes.length,
        notes,
      };

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindvault-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showSuccess(`Sauvegarde exportée avec succès — ${notes.length} note${notes.length !== 1 ? 's' : ''} incluse${notes.length !== 1 ? 's' : ''} (avec fichiers attachés).`);
    } catch (e) {
      showError(`Erreur lors de l'export : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(null);
    }
  };

  // ─── SÉLECTION DU FICHIER ──────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPreview(null);
    setSuccess('');
    setError('');
    setSelectedFile(null);

    if (!file) return;
    if (!file.name.endsWith('.json')) {
      showError('Fichier invalide : seuls les fichiers .json sont acceptés.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const parsed = JSON.parse(raw) as BackupFile;

        // Accepter soit le format backup (avec clé "notes"), soit un tableau direct
        const notesArray: unknown[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.notes)
          ? parsed.notes
          : [];

        if (notesArray.length === 0) {
          showError('Le fichier ne contient aucune note valide.');
          return;
        }

        const validNotes = notesArray.filter(isValidNote);
        if (validNotes.length === 0) {
          showError('Aucune note valide trouvée dans ce fichier. Vérifiez qu\'il s\'agit bien d\'une sauvegarde MindVault.');
          return;
        }

        const exportDate = parsed?.exportDate
          ? format(new Date(parsed.exportDate), 'd MMMM yyyy à HH:mm', { locale: fr })
          : 'Date inconnue';

        setPreview({ count: validNotes.length, date: exportDate });
        setSelectedFile(file);
      } catch {
        showError('Fichier JSON invalide ou corrompu. Impossible de lire les données.');
      }
    };
    reader.readAsText(file);
  };

  // ─── IMPORT ────────────────────────────────────────────────────────────────
  const handleImport = () => {
    if (!selectedFile || !preview) return;
    setLoading('import');
    setError('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const parsed = JSON.parse(raw) as BackupFile;

        const notesArray: unknown[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.notes)
          ? parsed.notes
          : [];

        const validNotes = notesArray.filter(isValidNote);

        importData(validNotes, importMode);

        const modeLabel = importMode === 'replace' ? 'remplacées' : 'fusionnées';
        showSuccess(
          `${validNotes.length} note${validNotes.length !== 1 ? 's' : ''} importée${validNotes.length !== 1 ? 's' : ''} et ${modeLabel} avec succès !`
        );
        setPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (e) {
        showError(`Erreur lors de l'import : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
      } finally {
        setLoading(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  // ─── RENDU ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '28px 40px', maxWidth: 860, margin: '0 auto' }}>

      {/* En-tête */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <ArrowRightLeft size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Transfert</h1>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
          Exportez l'intégralité de vos données dans un fichier de sauvegarde, puis réimportez-les sur n'importe quel appareil ou session.
        </p>
      </div>

      {/* Notifications */}
      {success && (
        <div className="animate-fade-up" style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 10, padding: '12px 16px', color: '#4ade80', fontSize: 14,
        }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="animate-fade-up" style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: 14,
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Bloc info */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 28,
        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 10, padding: '14px 18px',
      }}>
        <Info size={15} style={{ color: 'rgba(165,180,252,0.7)', marginTop: 1, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: 'rgba(165,180,252,0.7)', lineHeight: 1.7, margin: 0 }}>
          Le fichier de sauvegarde est un fichier <strong style={{ color: 'rgba(165,180,252,0.9)' }}>.json</strong> contenant
          toutes vos notes, tâches, tags, priorités et fichiers attachés (encodés en base64).
          Il peut être réimporté sur n'importe quel appareil ou session MindVault.
        </p>
      </div>

      {/* Grille Export / Import */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

        {/* ── EXPORT ── */}
        <div className="glass sweep-card" style={{ padding: '28px 26px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
            <Download size={26} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Exporter mes données</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.65, flex: 1 }}>
            Téléchargez un fichier JSON contenant l'intégralité de vos notes, checklists, fichiers attachés et métadonnées.
          </p>

          {/* Résumé des données */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 8,
            padding: '10px 14px', marginBottom: 18,
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Contenu de la sauvegarde
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
              <span>📝 {notes.length} note{notes.length !== 1 ? 's' : ''}</span>
              <span>✅ {notes.reduce((a, n) => a + n.checklist.length, 0)} tâches</span>
              <span>📎 {notes.reduce((a, n) => a + n.files.length, 0)} fichiers</span>
            </div>
          </div>

          <ul style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 22, lineHeight: 2.1, listStyle: 'none', padding: 0 }}>
            <li>✓ Toutes les notes et leur contenu</li>
            <li>✓ Checklists avec statut des tâches</li>
            <li>✓ Fichiers attachés (base64 inclus)</li>
            <li>✓ Tags, priorités, catégories, dates</li>
            <li>✓ Compatible import MindVault</li>
          </ul>

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleExport}
            disabled={loading !== null || notes.length === 0}
          >
            {loading === 'export'
              ? <span className="spinner" style={{ width: 14, height: 14 }} />
              : <Download size={14} />
            }
            {notes.length === 0 ? 'Aucune donnée à exporter' : 'Télécharger la sauvegarde'}
          </button>
        </div>

        {/* ── IMPORT ── */}
        <div className="glass sweep-card" style={{ padding: '28px 26px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
            <Upload size={26} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Importer une sauvegarde</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.65, flex: 1 }}>
            Chargez un fichier de sauvegarde MindVault (.json) pour restaurer vos données sur cet appareil ou cette session.
          </p>

          {/* Mode d'import */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Mode d'import
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['replace', 'merge'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setImportMode(mode)}
                  className="glass"
                  style={{
                    flex: 1, padding: '9px 12px', cursor: 'pointer', border: 'none',
                    borderColor: importMode === mode ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    background: importMode === mode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                    textAlign: 'center', transition: 'all 200ms',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: importMode === mode ? 'white' : 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                    {mode === 'replace' ? '🔄 Remplacer' : '➕ Fusionner'}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                    {mode === 'replace' ? 'Écrase les données' : 'Ajoute les nouvelles'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sélecteur de fichier */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '16px 14px',
              textAlign: 'center', cursor: 'pointer',
              marginBottom: 14, transition: 'border-color 200ms',
              background: 'rgba(255,255,255,0.02)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
          >
            <FileJson size={22} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 6 }} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un fichier .json'}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Aperçu du fichier sélectionné */}
          {preview && (
            <div className="animate-fade-up" style={{
              background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 14,
              fontSize: 12, color: 'rgba(134,239,172,0.8)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: 3 }}>
                ✓ Fichier valide — {preview.count} note{preview.count !== 1 ? 's' : ''} détectée{preview.count !== 1 ? 's' : ''}
              </div>
              <div style={{ color: 'rgba(134,239,172,0.5)' }}>Exporté le {preview.date}</div>
            </div>
          )}

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
            onClick={handleImport}
            disabled={loading !== null || !selectedFile || !preview}
          >
            {loading === 'import'
              ? <span className="spinner" style={{ width: 14, height: 14 }} />
              : <Upload size={14} />
            }
            {!selectedFile ? 'Sélectionnez un fichier' : `Importer (${importMode === 'replace' ? 'remplacer' : 'fusionner'})`}
          </button>
        </div>
      </div>

      {/* Bloc sécurité */}
      <div className="glass" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <ShieldCheck size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Confidentialité &amp; Sécurité
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { icon: '🔒', title: '100% local', desc: 'Le fichier ne quitte jamais votre appareil. Aucune donnée envoyée à un serveur.' },
            { icon: '📦', title: 'Format ouvert', desc: 'Fichier JSON lisible et portable, compatible avec tout éditeur de texte.' },
            { icon: <RefreshCw size={13} />, title: 'Sauvegarde régulière', desc: 'Exportez régulièrement pour éviter toute perte de données en cas de problème.' },
          ].map((item, i) => (
            <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
              <div style={{ marginBottom: 4, fontSize: 14 }}>{item.icon}</div>
              <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 3 }}>{item.title}</div>
              <div>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
