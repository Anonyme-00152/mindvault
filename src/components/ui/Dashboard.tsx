import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  StickyNote, CheckSquare, CalendarDays, Bot, TrendingUp, Clock, Zap
} from 'lucide-react';
import { useApp } from '../../store/AppContext';

export function Dashboard({ onNewNote }: { onNewNote: () => void }) {
  const { notes, setCurrentView } = useApp();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayNotes = notes.filter(n => n.date === todayStr);
  const totalTasks = notes.reduce((acc, n) => acc + n.checklist.length, 0);
  const doneTasks = notes.reduce((acc, n) => acc + n.checklist.filter(c => c.done).length, 0);
  const totalFiles = notes.reduce((acc, n) => acc + n.files.length, 0);
  const recentNotes = [...notes].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 5);

  const stats = [
    { label: 'Notes totales', value: notes.length, icon: <StickyNote size={18} />, sub: `${todayNotes.length} aujourd'hui` },
    { label: 'Tâches', value: totalTasks, icon: <CheckSquare size={18} />, sub: `${doneTasks} complétées` },
    { label: 'Fichiers', value: totalFiles, icon: <CalendarDays size={18} />, sub: 'stockés localement' },
    { label: 'Progression', value: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) + '%' : '—', icon: <TrendingUp size={18} />, sub: 'tâches terminées' },
  ];

  const priorityColors: Record<string, string> = {
    urgent: '#f87171', high: '#fb923c', medium: '#facc15', low: '#4ade80',
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          {format(today, 'EEEE d MMMM yyyy', { locale: fr })}
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Bonjour <span className="text-gradient">👋</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8, fontSize: 15 }}>
          {todayNotes.length > 0
            ? `Vous avez ${todayNotes.length} note${todayNotes.length > 1 ? 's' : ''} planifiée${todayNotes.length > 1 ? 's' : ''} aujourd'hui.`
            : 'Aucune note planifiée aujourd\'hui. Commencez par en créer une.'}
        </p>
      </div>

      {/* Quick actions */}
      <div className="animate-fade-up delay-100" style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={onNewNote}>
          <Zap size={14} />
          Nouvelle note rapide
        </button>
        <button className="btn-ghost" onClick={() => setCurrentView('ai')}>
          <Bot size={14} />
          Voir ma journée avec l'IA
        </button>
        <button className="btn-ghost" onClick={() => setCurrentView('calendar')}>
          <CalendarDays size={14} />
          Ouvrir le calendrier
        </button>
      </div>

      {/* Stats grid */}
      <div className="animate-fade-up delay-200" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 40,
      }}>
        {stats.map((s, i) => (
          <div key={i} className="glass glass-hover sweep-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ color: 'rgba(255,255,255,0.35)' }}>{s.icon}</div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>{s.sub}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: 'white' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Today's notes */}
        <div className="animate-fade-up delay-300">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Notes du jour</h2>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setCurrentView('notes')}>
              Voir tout
            </button>
          </div>
          {todayNotes.length === 0 ? (
            <div className="glass" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Aucune note aujourd'hui</div>
              <button className="btn-ghost" style={{ marginTop: 12, fontSize: 12 }} onClick={onNewNote}>
                Créer une note
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayNotes.map(note => (
                <div key={note.id} className="note-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 6,
                      background: priorityColors[note.priority] || 'rgba(255,255,255,0.3)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'white', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {note.title || 'Sans titre'}
                      </div>
                      {note.content && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {note.content}
                        </div>
                      )}
                    </div>
                    {note.time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.3)', fontSize: 11, flexShrink: 0 }}>
                        <Clock size={10} />
                        {note.time}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent notes */}
        <div className="animate-fade-up delay-400">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Récemment modifiées</h2>
          </div>
          {recentNotes.length === 0 ? (
            <div className="glass" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Aucune note</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentNotes.map(note => (
                <div key={note.id} className="note-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: priorityColors[note.priority] || 'rgba(255,255,255,0.3)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {note.title || 'Sans titre'}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                      {format(new Date(note.updatedAt), 'd MMM', { locale: fr })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
