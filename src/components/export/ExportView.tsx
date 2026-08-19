import React, { useState } from 'react';
import { Download, FileText, Archive, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import { useApp } from '../../store/AppContext';
import type { Note } from '../../types';

type Period = 'week' | 'month' | 'year' | 'all';

function getInterval(period: Period): { start: Date; end: Date } | null {
  const now = new Date();
  if (period === 'week')  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  if (period === 'month') return { start: startOfMonth(now), end: endOfMonth(now) };
  if (period === 'year')  return { start: startOfYear(now), end: endOfYear(now) };
  return null;
}

function filterNotesByPeriod(notes: Note[], period: Period): Note[] {
  if (period === 'all') return notes;
  const interval = getInterval(period);
  if (!interval) return notes;
  return notes.filter(n => {
    if (!n.date) return false;
    try { return isWithinInterval(parseISO(n.date), interval); } catch { return false; }
  });
}

export function ExportView() {
  const { notes } = useApp();
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const filteredNotes = filterNotesByPeriod(notes, period);
  const interval = getInterval(period);

  const periodLabel: Record<Period, string> = {
    week: 'cette semaine', month: 'ce mois', year: 'cette année', all: 'toutes les notes',
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  const exportPDF = async () => {
    setLoading('pdf');
    setError('');
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210;
      const margin = 20;
      const contentW = pageW - margin * 2;
      let y = 20;

      const addPage = () => { doc.addPage(); y = 20; };
      const checkPage = (needed: number) => { if (y + needed > 280) addPage(); };

      // Title
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, 210, 297, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('MindVault — Export', margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(`Généré le ${format(new Date(), 'd MMMM yyyy à HH:mm', { locale: fr })}`, margin, y);
      y += 6;
      if (interval) {
        doc.text(`Période : ${format(interval.start, 'd MMM yyyy', { locale: fr })} — ${format(interval.end, 'd MMM yyyy', { locale: fr })}`, margin, y);
        y += 6;
      }
      doc.text(`${filteredNotes.length} note${filteredNotes.length !== 1 ? 's' : ''} exportée${filteredNotes.length !== 1 ? 's' : ''}`, margin, y);
      y += 12;

      // Divider
      doc.setDrawColor(60, 60, 60);
      doc.line(margin, y, pageW - margin, y);
      y += 10;

      // Notes
      for (const note of filteredNotes) {
        checkPage(30);

        // Note title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        const titleLines = doc.splitTextToSize(note.title || 'Sans titre', contentW);
        doc.text(titleLines, margin, y);
        y += titleLines.length * 7;

        // Meta
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        const meta = [
          note.date ? `📅 ${note.date}${note.time ? ` à ${note.time}` : ''}` : '',
          `Priorité: ${note.priority}`,
          `Catégorie: ${note.category}`,
          note.tags.length > 0 ? `Tags: ${note.tags.join(', ')}` : '',
        ].filter(Boolean).join('  ·  ');
        doc.text(meta, margin, y);
        y += 6;

        // Content
        if (note.content) {
          checkPage(15);
          doc.setFontSize(10);
          doc.setTextColor(200, 200, 200);
          const lines = doc.splitTextToSize(note.content, contentW);
          const linesNeeded = lines.length * 5;
          if (y + linesNeeded > 280) addPage();
          doc.text(lines, margin, y);
          y += linesNeeded + 3;
        }

        // Checklist
        if (note.checklist.length > 0) {
          checkPage(10);
          doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text(`Checklist (${note.checklist.filter(c => c.done).length}/${note.checklist.length}) :`, margin, y);
          y += 5;
          for (const item of note.checklist) {
            checkPage(5);
            doc.setTextColor(item.done ? 100 : 180, item.done ? 100 : 180, item.done ? 100 : 180);
            doc.text(`  ${item.done ? '✓' : '○'} ${item.text}`, margin, y);
            y += 5;
          }
          y += 2;
        }

        // Files
        if (note.files.length > 0) {
          checkPage(10);
          doc.setFontSize(9);
          doc.setTextColor(120, 120, 120);
          doc.text(`Fichiers (${note.files.length}) :`, margin, y);
          y += 5;
          for (const f of note.files) {
            checkPage(5);
            doc.text(`  📎 ${f.name} (${f.type}, ${(f.size / 1024).toFixed(1)} KB) — Chemin: /files/${f.name}`, margin, y);
            y += 5;
          }
          y += 2;
        }

        // Separator
        checkPage(8);
        doc.setDrawColor(40, 40, 40);
        doc.line(margin, y, pageW - margin, y);
        y += 8;
      }

      doc.save(`mindvault-export-${period}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      showSuccess('PDF généré et téléchargé avec succès !');
    } catch (e) {
      setError(`Erreur lors de la génération du PDF: ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(null);
    }
  };

  const exportZIP = async () => {
    setLoading('zip');
    setError('');
    try {
      const zip = new JSZip();
      const notesFolder = zip.folder('notes')!;
      const filesFolder = zip.folder('files')!;

      // Summary JSON
      const summary = {
        exportDate: new Date().toISOString(),
        period,
        totalNotes: filteredNotes.length,
        notes: filteredNotes.map(n => ({
          id: n.id, title: n.title, content: n.content,
          date: n.date, time: n.time, priority: n.priority, category: n.category,
          tags: n.tags, checklist: n.checklist,
          files: n.files.map(f => ({ name: f.name, type: f.type, size: f.size, path: `/files/${f.name}` })),
          createdAt: n.createdAt, updatedAt: n.updatedAt,
        })),
      };
      zip.file('summary.json', JSON.stringify(summary, null, 2));

      // Individual note files
      for (const note of filteredNotes) {
        let noteContent = `# ${note.title || 'Sans titre'}\n\n`;
        noteContent += `**Date:** ${note.date || 'Non définie'}${note.time ? ` à ${note.time}` : ''}\n`;
        noteContent += `**Priorité:** ${note.priority}\n`;
        noteContent += `**Catégorie:** ${note.category}\n`;
        if (note.tags.length > 0) noteContent += `**Tags:** ${note.tags.join(', ')}\n`;
        noteContent += `\n---\n\n`;
        if (note.content) noteContent += `${note.content}\n\n`;
        if (note.checklist.length > 0) {
          noteContent += `## Checklist\n\n`;
          note.checklist.forEach(c => { noteContent += `- [${c.done ? 'x' : ' '}] ${c.text}\n`; });
          noteContent += '\n';
        }
        if (note.files.length > 0) {
          noteContent += `## Fichiers\n\n`;
          note.files.forEach(f => {
            noteContent += `- **${f.name}** (${f.type})\n`;
            noteContent += `  - Taille: ${(f.size / 1024).toFixed(1)} KB\n`;
            noteContent += `  - Chemin dans le ZIP: /files/${f.name}\n`;
          });
        }
        const safeTitle = (note.title || 'sans-titre').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        notesFolder.file(`${safeTitle}-${note.id.slice(0, 8)}.md`, noteContent);

        // Attach files
        for (const f of note.files) {
          try {
            const base64 = f.dataUrl.split(',')[1];
            if (base64) filesFolder.file(f.name, base64, { base64: true });
          } catch {
            // File encoding error — skip
          }
        }
      }

      // README
      zip.file('README.md', `# MindVault Export\n\nExporté le ${format(new Date(), 'd MMMM yyyy à HH:mm', { locale: fr })}\n\nPériode: ${periodLabel[period]}\n\n## Structure\n\n- \`summary.json\` — Résumé complet en JSON\n- \`notes/\` — Notes individuelles en Markdown\n- \`files/\` — Fichiers attachés\n\n## Notes exportées: ${filteredNotes.length}\n`);

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindvault-export-${period}-${format(new Date(), 'yyyy-MM-dd')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Archive ZIP générée et téléchargée avec succès !');
    } catch (e) {
      setError(`Erreur lors de la génération du ZIP: ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(null);
    }
  };

  const periods: { value: Period; label: string; sub: string }[] = [
    { value: 'week',  label: 'Cette semaine', sub: interval && period === 'week' ? `${format(interval.start, 'd MMM', { locale: fr })} — ${format(interval.end, 'd MMM', { locale: fr })}` : '' },
    { value: 'month', label: 'Ce mois',       sub: format(new Date(), 'MMMM yyyy', { locale: fr }) },
    { value: 'year',  label: 'Cette année',   sub: format(new Date(), 'yyyy') },
    { value: 'all',   label: 'Tout',          sub: `${notes.length} notes` },
  ];

  return (
    <div style={{ padding: '28px 40px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Export</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
          Exportez vos notes et fichiers en PDF ou ZIP
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

      {/* Period selector */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Période
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="glass"
              style={{
                padding: '14px 16px', cursor: 'pointer', border: 'none',
                borderColor: period === p.value ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                background: period === p.value ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                textAlign: 'left', transition: 'all 200ms',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: period === p.value ? 'white' : 'rgba(255,255,255,0.6)', marginBottom: 2 }}>
                {p.label}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{p.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="glass" style={{ padding: '18px 22px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4 }}>
              Aperçu de l'export
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} — {periodLabel[period]}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            <span>📝 {filteredNotes.reduce((a, n) => a + n.checklist.length, 0)} tâches</span>
            <span>📎 {filteredNotes.reduce((a, n) => a + n.files.length, 0)} fichiers</span>
          </div>
        </div>
        {filteredNotes.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredNotes.slice(0, 5).map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                {n.title || 'Sans titre'}
                {n.date && <span style={{ color: 'rgba(255,255,255,0.25)' }}>· {n.date}</span>}
              </div>
            ))}
            {filteredNotes.length > 5 && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', paddingLeft: 12 }}>
                +{filteredNotes.length - 5} autres notes...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="glass sweep-card" style={{ padding: '24px 24px' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}><FileText size={24} /></div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Export PDF</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.6 }}>
            Génère un document PDF avec toutes vos notes, tâches et références aux fichiers.
          </p>
          <ul style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20, lineHeight: 2, listStyle: 'none' }}>
            <li>✓ Contenu des notes</li>
            <li>✓ Checklists avec statut</li>
            <li>✓ Noms et chemins des fichiers</li>
            <li>✓ Messages d'erreur si données manquantes</li>
          </ul>
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={exportPDF}
            disabled={loading !== null || filteredNotes.length === 0}
          >
            {loading === 'pdf' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Download size={14} />}
            Télécharger PDF
          </button>
        </div>

        <div className="glass sweep-card" style={{ padding: '24px 24px' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}><Archive size={24} /></div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Export ZIP</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.6 }}>
            Archive complète avec toutes les notes en Markdown, les fichiers attachés et un résumé JSON.
          </p>
          <ul style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20, lineHeight: 2, listStyle: 'none' }}>
            <li>✓ Notes en Markdown</li>
            <li>✓ Fichiers originaux inclus</li>
            <li>✓ Résumé JSON structuré</li>
            <li>✓ README avec structure</li>
          </ul>
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={exportZIP}
            disabled={loading !== null || filteredNotes.length === 0}
          >
            {loading === 'zip' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Archive size={14} />}
            Télécharger ZIP
          </button>
        </div>
      </div>

      {filteredNotes.length === 0 && (
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          Aucune note à exporter pour cette période.
        </div>
      )}
    </div>
  );
}
