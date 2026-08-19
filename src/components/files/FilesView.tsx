import React, { useState } from 'react';
import { FolderOpen, Image, Film, FileText, File, Search, Download } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import type { NoteFile, FileType } from '../../types';

const typeIcons: Record<FileType, React.ReactNode> = {
  image:    <Image size={16} />,
  video:    <Film size={16} />,
  document: <FileText size={16} />,
  other:    <File size={16} />,
};

const typeLabels: Record<FileType, string> = {
  image: 'Images', video: 'Vidéos', document: 'Documents', other: 'Autres',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesView() {
  const { notes } = useApp();
  const [filterType, setFilterType] = useState<FileType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Collect all files with note context
  const allFiles = notes.flatMap(note =>
    note.files.map(f => ({ ...f, noteId: note.id, noteTitle: note.title }))
  );

  const filtered = allFiles.filter(f => {
    if (filterType !== 'all' && f.type !== filterType) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: allFiles.length,
    images: allFiles.filter(f => f.type === 'image').length,
    videos: allFiles.filter(f => f.type === 'video').length,
    documents: allFiles.filter(f => f.type === 'document').length,
    totalSize: allFiles.reduce((acc, f) => acc + f.size, 0),
  };

  const downloadFile = (f: NoteFile & { noteTitle: string }) => {
    const a = document.createElement('a');
    a.href = f.dataUrl;
    a.download = f.name;
    a.click();
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Fichiers</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
          {stats.total} fichier{stats.total !== 1 ? 's' : ''} — {formatSize(stats.totalSize)}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {([
          { type: 'all' as const, label: 'Tous', count: stats.total, icon: <FolderOpen size={16} /> },
          { type: 'image' as const, label: 'Images', count: stats.images, icon: <Image size={16} /> },
          { type: 'video' as const, label: 'Vidéos', count: stats.videos, icon: <Film size={16} /> },
          { type: 'document' as const, label: 'Documents', count: stats.documents, icon: <FileText size={16} /> },
        ] as const).map(s => (
          <button
            key={s.type}
            onClick={() => setFilterType(s.type)}
            className="glass glass-hover"
            style={{
              padding: '16px 18px', cursor: 'pointer', border: 'none',
              borderColor: filterType === s.type ? 'rgba(255,255,255,0.2)' : undefined,
              background: filterType === s.type ? 'rgba(255,255,255,0.08)' : undefined,
              textAlign: 'left', transition: 'all 200ms',
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'white' }}>{s.count}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Search & view toggle */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            className="input-premium"
            style={{ paddingLeft: 34, height: 38, fontSize: 13 }}
            placeholder="Rechercher un fichier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          {(['grid', 'list'] as const).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              style={{
                padding: '7px 14px', border: 'none', cursor: 'pointer', fontSize: 12,
                background: viewMode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: viewMode === m ? 'white' : 'rgba(255,255,255,0.4)',
                transition: 'all 150ms',
              }}
            >
              {m === 'grid' ? '⊞ Grille' : '☰ Liste'}
            </button>
          ))}
        </div>
      </div>

      {/* Files */}
      {filtered.length === 0 ? (
        <div className="glass" style={{ padding: 60, textAlign: 'center' }}>
          <FolderOpen size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
            {allFiles.length === 0 ? 'Aucun fichier. Ajoutez des fichiers à vos notes.' : 'Aucun fichier correspondant.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {filtered.map((f, i) => (
            <div
              key={f.id}
              className="glass glass-hover sweep-card animate-fade-up"
              style={{ padding: 0, overflow: 'hidden', animationDelay: `${i * 0.03}s`, cursor: 'pointer' }}
              onClick={() => downloadFile(f)}
            >
              <div className="file-thumb" style={{ borderRadius: '12px 12px 0 0', border: 'none' }}>
                {f.type === 'image' && <img src={f.dataUrl} alt={f.name} />}
                {f.type === 'video' && <video src={f.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                {(f.type === 'document' || f.type === 'other') && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 20 }}>
                    <div style={{ fontSize: 36 }}>{f.type === 'document' ? '📄' : '📎'}</div>
                  </div>
                )}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                  {f.name}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                  {formatSize(f.size)} · {f.noteTitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((f, i) => (
            <div
              key={f.id}
              className="note-card animate-fade-up"
              style={{ display: 'flex', alignItems: 'center', gap: 14, animationDelay: `${i * 0.02}s`, cursor: 'pointer' }}
              onClick={() => downloadFile(f)}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {f.type === 'image' ? <img src={f.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : typeIcons[f.type]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {typeLabels[f.type]} · {formatSize(f.size)} · Note: {f.noteTitle}
                </div>
              </div>
              <button
                className="btn-ghost"
                style={{ fontSize: 12, padding: '5px 10px', flexShrink: 0 }}
                onClick={e => { e.stopPropagation(); downloadFile(f); }}
              >
                <Download size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
