import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Trash2, Edit2, Calendar, Clock, Tag, CheckSquare, FileText, Filter } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { NoteModal } from './NoteModal';
import type { Note, Priority, Category } from '../../types';

const priorityClass: Record<Priority, string> = {
  urgent: 'priority-urgent', high: 'priority-high', medium: 'priority-medium', low: 'priority-low',
};
const priorityLabel: Record<Priority, string> = {
  urgent: 'Urgent', high: 'Haute', medium: 'Moyenne', low: 'Basse',
};
const categoryLabel: Record<Category, string> = {
  work: 'Travail', personal: 'Personnel', health: 'Santé',
  finance: 'Finance', ideas: 'Idées', other: 'Autre',
};

export function NotesView() {
  const { notes, deleteNote, getFilteredNotes } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'updated' | 'priority'>('updated');

  const filtered = getFilteredNotes().filter(n => {
    if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && n.category !== filterCategory) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (sortBy === 'date') return (a.date || '').localeCompare(b.date || '');
    const order = { urgent: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });

  const handleEdit = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNote(note);
    setShowModal(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer cette note ?')) deleteNote(id);
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* List panel */}
      <div style={{
        width: viewNote ? 380 : '100%',
        flexShrink: 0,
        padding: '28px 28px',
        display: 'flex', flexDirection: 'column', gap: 20,
        borderRight: viewNote ? '1px solid rgba(255,255,255,0.06)' : 'none',
        overflowY: 'auto',
        transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Notes</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {filtered.length} note{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn-primary" onClick={() => { setEditingNote(null); setShowModal(true); }}>
            <Plus size={14} /> Nouvelle
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <select
            className="input-premium"
            style={{ width: 'auto', padding: '5px 10px', fontSize: 12 }}
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
          >
            <option value="all">Toutes priorités</option>
            <option value="urgent">Urgent</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
          <select
            className="input-premium"
            style={{ width: 'auto', padding: '5px 10px', fontSize: 12 }}
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as Category | 'all')}
          >
            <option value="all">Toutes catégories</option>
            <option value="work">Travail</option>
            <option value="personal">Personnel</option>
            <option value="health">Santé</option>
            <option value="finance">Finance</option>
            <option value="ideas">Idées</option>
            <option value="other">Autre</option>
          </select>
          <select
            className="input-premium"
            style={{ width: 'auto', padding: '5px 10px', fontSize: 12 }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'updated' | 'priority')}
          >
            <option value="updated">Récemment modifiées</option>
            <option value="date">Par date</option>
            <option value="priority">Par priorité</option>
          </select>
        </div>

        {/* Notes list */}
        {filtered.length === 0 ? (
          <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
            <FileText size={32} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>Aucune note trouvée</p>
            <button className="btn-ghost" style={{ marginTop: 16 }} onClick={() => { setEditingNote(null); setShowModal(true); }}>
              Créer une note
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((note, i) => (
              <div
                key={note.id}
                className={`note-card animate-fade-up ${viewNote?.id === note.id ? 'selected' : ''}`}
                style={{ animationDelay: `${i * 0.04}s` }}
                onClick={() => setViewNote(viewNote?.id === note.id ? null : note)}
              >
                {note.coverImage && (
                  <div style={{ height: 80, borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
                    <img src={note.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className={`tag ${priorityClass[note.priority]}`} style={{ fontSize: 10 }}>
                        {priorityLabel[note.priority]}
                      </span>
                      <span className="tag" style={{ fontSize: 10 }}>{categoryLabel[note.category]}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {note.title || 'Sans titre'}
                    </div>
                    {note.content && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                        {note.content}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {note.date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                          <Calendar size={10} />
                          {format(new Date(note.date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}
                          {note.time && <><Clock size={10} />{note.time}</>}
                        </span>
                      )}
                      {note.checklist.length > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                          <CheckSquare size={10} />
                          {note.checklist.filter(c => c.done).length}/{note.checklist.length}
                        </span>
                      )}
                      {note.files.length > 0 && (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                          📎 {note.files.length}
                        </span>
                      )}
                      {note.tags.map(t => (
                        <span key={t} style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>#{t}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={e => handleEdit(note, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 6, borderRadius: 6, transition: 'all 150ms' }}
                      title="Modifier"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={e => handleDelete(note.id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.4)', padding: 6, borderRadius: 6, transition: 'all 150ms' }}
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {viewNote && (
        <NoteDetail
          note={viewNote}
          onClose={() => setViewNote(null)}
          onEdit={() => { setEditingNote(viewNote); setShowModal(true); }}
        />
      )}

      {/* Modal */}
      {showModal && (
        <NoteModal
          note={editingNote}
          onClose={() => { setShowModal(false); setEditingNote(null); }}
        />
      )}
    </div>
  );
}

function NoteDetail({ note, onClose, onEdit }: { note: Note; onClose: () => void; onEdit: () => void }) {
  const { toggleChecklistItem } = useApp();
  const priorityLabel: Record<Priority, string> = {
    urgent: 'Urgent', high: 'Haute', medium: 'Moyenne', low: 'Basse',
  };
  const priorityClass: Record<Priority, string> = {
    urgent: 'priority-urgent', high: 'priority-high', medium: 'priority-medium', low: 'priority-low',
  };

  return (
    <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', animation: 'fadeIn 0.25s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={onEdit}><Edit2 size={13} /> Modifier</button>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
        >
          <X size={16} />
        </button>
      </div>

      {note.coverImage && (
        <div style={{ height: 180, borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
          <img src={note.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className={`tag ${priorityClass[note.priority]}`}>{priorityLabel[note.priority]}</span>
        {note.date && (
          <span className="tag">
            <Calendar size={10} />
            {format(new Date(note.date + 'T00:00:00'), 'd MMMM yyyy', { locale: fr })}
            {note.time && ` à ${note.time}`}
          </span>
        )}
        {note.tags.map(t => <span key={t} className="tag">#{t}</span>)}
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
        {note.title || 'Sans titre'}
      </h1>

      {note.content && (
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 24, whiteSpace: 'pre-wrap' }}>
          {note.content}
        </p>
      )}

      {note.checklist.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Checklist — {note.checklist.filter(c => c.done).length}/{note.checklist.length}
          </div>
          {/* Progress bar */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 12 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: 'rgba(255,255,255,0.4)',
              width: `${note.checklist.length > 0 ? (note.checklist.filter(c => c.done).length / note.checklist.length) * 100 : 0}%`,
              transition: 'width 300ms',
            }} />
          </div>
          {note.checklist.map(item => (
            <div key={item.id} className="checklist-item" style={{ cursor: 'pointer' }} onClick={() => toggleChecklistItem(note.id, item.id)}>
              <div className={`checkbox-custom ${item.done ? 'checked' : ''}`}>
                {item.done && <Check size={10} color="white" />}
              </div>
              <span style={{
                fontSize: 14, color: item.done ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)',
                textDecoration: item.done ? 'line-through' : 'none',
              }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {note.files.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Fichiers ({note.files.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {note.files.map(f => (
              <div key={f.id}>
                <div className="file-thumb">
                  {f.type === 'image' && <img src={f.dataUrl} alt={f.name} />}
                  {f.type === 'video' && <video src={f.dataUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />}
                  {(f.type === 'document' || f.type === 'other') && (
                    <div style={{ textAlign: 'center', padding: 12 }}>
                      <div style={{ fontSize: 28 }}>📄</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{f.name}</div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Missing import
import { X, Check } from 'lucide-react';
