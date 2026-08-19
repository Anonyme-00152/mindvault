import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Check, Upload, Tag, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import type { Note, Priority, Category, ChecklistItem, NoteFile, FileType } from '../../types';

interface NoteModalProps {
  note?: Note | null;
  onClose: () => void;
  defaultDate?: string;
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high',   label: 'Haute' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'low',    label: 'Basse' },
];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'work',     label: 'Travail' },
  { value: 'personal', label: 'Personnel' },
  { value: 'health',   label: 'Santé' },
  { value: 'finance',  label: 'Finance' },
  { value: 'ideas',    label: 'Idées' },
  { value: 'other',    label: 'Autre' },
];

function getFileType(mime: string): FileType {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.includes('pdf') || mime.includes('word') || mime.includes('document')) return 'document';
  return 'other';
}

export function NoteModal({ note, onClose, defaultDate }: NoteModalProps) {
  const { addNote, updateNote } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [date, setDate] = useState(note?.date || defaultDate || '');
  const [time, setTime] = useState(note?.time || '');
  const [priority, setPriority] = useState<Priority>(note?.priority || 'medium');
  const [category, setCategory] = useState<Category>(note?.category || 'other');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(note?.checklist || []);
  const [files, setFiles] = useState<NoteFile[]>(note?.files || []);
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [coverImage, setCoverImage] = useState(note?.coverImage || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedFilePreview, setSelectedFilePreview] = useState<NoteFile | null>(null);

  const handleSave = () => {
    if (!title.trim()) { setError('Le titre est requis.'); return; }
    setSaving(true);
    const data = { title: title.trim(), content, date, time, priority, category, checklist, files, tags, coverImage };
    if (note) {
      updateNote(note.id, data);
    } else {
      addNote(data);
    }
    setTimeout(() => { setSaving(false); onClose(); }, 300);
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist(prev => [...prev, { id: crypto.randomUUID(), text: newCheckItem.trim(), done: false }]);
    setNewCheckItem('');
  };

  const toggleCheck = (id: string) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  const removeCheck = (id: string) => {
    setChecklist(prev => prev.filter(c => c.id !== id));
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); }
    setTagInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    uploadedFiles.forEach(f => {
      if (f.size > 50 * 1024 * 1024) { setError(`Fichier trop volumineux: ${f.name} (max 50MB)`); return; }
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        const newFile: NoteFile = {
          id: crypto.randomUUID(),
          name: f.name,
          type: getFileType(f.type),
          size: f.size,
          dataUrl,
          mimeType: f.type,
        };
        setFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setCoverImage(ev.target?.result as string);
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const priorityClass: Record<Priority, string> = {
    urgent: 'priority-urgent', high: 'priority-high', medium: 'priority-medium', low: 'priority-low',
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="glass"
        style={{
          width: '100%', maxWidth: 680, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          animation: 'fadeUp 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Cover image */}
        {coverImage && (
          <div style={{ height: 140, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <img src={coverImage} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,10,0.8))',
            }} />
            <button
              onClick={() => setCoverImage('')}
              style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 6,
                color: 'white', cursor: 'pointer', padding: '4px 8px', fontSize: 12,
              }}
            >
              Supprimer
            </button>
          </div>
        )}

        {/* Header */}
        <div style={{
          padding: '20px 24px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>
            {note ? 'Modifier la note' : 'Nouvelle note'}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {!coverImage && (
              <>
                <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
                <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => coverInputRef.current?.click()}>
                  Image de couverture
                </button>
              </>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="scroll-area" style={{ flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13,
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Title */}
          <input
            className="input-premium"
            style={{ fontSize: 18, fontWeight: 600, padding: '12px 14px' }}
            placeholder="Titre de la note..."
            value={title}
            onChange={e => { setTitle(e.target.value); setError(''); }}
          />

          {/* Content */}
          <textarea
            className="input-premium"
            style={{ minHeight: 100 }}
            placeholder="Contenu libre..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />

          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={12} /> Date
              </label>
              <input
                type="date"
                className="input-premium"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12} /> Heure (optionnel)
              </label>
              <input
                type="time"
                className="input-premium"
                value={time}
                onChange={e => setTime(e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Priority & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block' }}>Priorité</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={`tag ${priority === p.value ? priorityClass[p.value] : ''}`}
                    style={{ cursor: 'pointer', border: priority === p.value ? undefined : '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block' }}>Catégorie</label>
              <select
                className="input-premium"
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                style={{ colorScheme: 'dark', cursor: 'pointer' }}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={12} /> Tags
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {tags.map(t => (
                <span key={t} className="tag" style={{ cursor: 'pointer' }} onClick={() => setTags(prev => prev.filter(x => x !== t))}>
                  #{t} <X size={10} />
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input-premium"
                style={{ flex: 1 }}
                placeholder="Ajouter un tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
              />
              <button className="btn-ghost" onClick={addTag}><Plus size={14} /></button>
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, display: 'block' }}>
              Checklist ({checklist.filter(c => c.done).length}/{checklist.length})
            </label>
            <div style={{ marginBottom: 8 }}>
              {checklist.map(item => (
                <div key={item.id} className="checklist-item">
                  <div
                    className={`checkbox-custom ${item.done ? 'checked' : ''}`}
                    onClick={() => toggleCheck(item.id)}
                  >
                    {item.done && <Check size={10} color="white" />}
                  </div>
                  <span style={{
                    flex: 1, fontSize: 14, color: item.done ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)',
                    textDecoration: item.done ? 'line-through' : 'none',
                  }}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => removeCheck(item.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 4 }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input-premium"
                style={{ flex: 1 }}
                placeholder="Nouvelle tâche..."
                value={newCheckItem}
                onChange={e => setNewCheckItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCheckItem()}
              />
              <button className="btn-ghost" onClick={addCheckItem}><Plus size={14} /></button>
            </div>
          </div>

          {/* Files */}
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, display: 'block' }}>
              Fichiers ({files.length})
            </label>
            {files.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 10 }}>
                {files.map(f => (
                  <div key={f.id} style={{ position: 'relative' }}>
                    <div
                      className="file-thumb"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (f.type === 'image' || f.type === 'video') {
                          setSelectedFilePreview(f);
                        }
                      }}
                      style={{ 
                        cursor: (f.type === 'image' || f.type === 'video') ? 'pointer' : 'default',
                        position: 'relative',
                        zIndex: 10,
                        pointerEvents: 'auto'
                      }}
                    >
                      {f.type === 'image' && <img src={f.dataUrl} alt={f.name} />}
                      {f.type === 'video' && <video src={f.dataUrl} />}
                      {(f.type === 'document' || f.type === 'other') && (
                        <div style={{ textAlign: 'center', padding: 8 }}>
                          <div style={{ fontSize: 24 }}>📄</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.name}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 4,
                        color: 'white', cursor: 'pointer', padding: '2px 4px',
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileUpload} />
            <button className="btn-ghost" onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} />
              Ajouter des fichiers
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button className="btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
            {note ? 'Enregistrer' : 'Créer la note'}
          </button>
        </div>
      </div>

      {/* Lightbox de prévisualisation */}
      {selectedFilePreview && (
        <div
          onClick={() => setSelectedFilePreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            cursor: 'zoom-out',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '95vw',
              maxHeight: '95vh',
              cursor: 'default',
            }}
            onClick={e => e.stopPropagation()}
          >
            {selectedFilePreview.type === 'image' && (
              <img
                src={selectedFilePreview.dataUrl}
                alt={selectedFilePreview.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '85vh',
                  borderRadius: 12,
                  objectFit: 'contain',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            )}
            {selectedFilePreview.type === 'video' && (
              <video
                src={selectedFilePreview.dataUrl}
                controls
                autoPlay
                style={{
                  maxWidth: '100%',
                  maxHeight: '85vh',
                  borderRadius: 12,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                }}
              />
            )}
            
            <div style={{
              marginTop: 16,
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ opacity: 0.5 }}>{selectedFilePreview.type === 'image' ? '🖼️' : '🎬'}</span>
              {selectedFilePreview.name}
            </div>

            <button
              onClick={() => setSelectedFilePreview(null)}
              style={{
                position: 'absolute',
                top: -50,
                right: 0,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                color: 'white',
                cursor: 'pointer',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 200ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
