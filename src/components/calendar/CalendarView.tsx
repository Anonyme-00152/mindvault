import React, { useState } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { NoteModal } from '../notes/NoteModal';
import type { Note, Priority } from '../../types';

const priorityColors: Record<Priority, string> = {
  urgent: '#f87171', high: '#fb923c', medium: '#facc15', low: '#4ade80',
};

export function CalendarView() {
  const { notes } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getNotesForDay = (day: Date) => {
    const str = format(day, 'yyyy-MM-dd');
    return notes.filter(n => n.date === str);
  };

  const selectedDayNotes = selectedDay ? getNotesForDay(selectedDay) : [];
  const selectedDayStr = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : '';

  // Agenda: all notes with dates, sorted
  const agendaNotes = [...notes]
    .filter(n => n.date)
    .sort((a, b) => (a.date! + (a.time || '')).localeCompare(b.date! + (b.time || '')));

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Calendar main */}
      <div style={{ flex: 1, padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Calendrier</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {notes.filter(n => n.date).length} notes planifiées
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              {(['month', 'agenda'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  style={{
                    padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    background: viewMode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: viewMode === m ? 'white' : 'rgba(255,255,255,0.4)',
                    transition: 'all 200ms',
                  }}
                >
                  {m === 'month' ? 'Mois' : 'Agenda'}
                </button>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>

        {viewMode === 'month' ? (
          <>
            {/* Month navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={prevMonth}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'white', transition: 'all 150ms' }}
              >
                <ChevronLeft size={16} />
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', flex: 1, textAlign: 'center' }}>
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </h2>
              <button
                onClick={nextMonth}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'white', transition: 'all 150ms' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekday headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {weekDays.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', padding: '6px 0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {days.map(day => {
                const dayNotes = getNotesForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isT = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`cal-day ${isT ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDay(day)}
                    style={{ opacity: isCurrentMonth ? 1 : 0.25 }}
                  >
                    <span style={{
                      fontSize: 13, fontWeight: isT ? 700 : 400,
                      color: isT ? 'white' : 'rgba(255,255,255,0.7)',
                      marginBottom: 4,
                    }}>
                      {format(day, 'd')}
                    </span>
                    {dayNotes.slice(0, 3).map(n => (
                      <div key={n.id} style={{
                        width: '100%', height: 4, borderRadius: 2,
                        background: priorityColors[n.priority],
                        opacity: 0.7, marginBottom: 1,
                      }} />
                    ))}
                    {dayNotes.length > 3 && (
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>+{dayNotes.length - 3}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Agenda view */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agendaNotes.length === 0 ? (
              <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>Aucune note planifiée</p>
              </div>
            ) : (
              agendaNotes.map((note, i) => (
                <AgendaItem key={note.id} note={note} index={i} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Day detail sidebar */}
      {selectedDay && viewMode === 'month' && (
        <div style={{
          width: 300, flexShrink: 0,
          padding: '28px 20px',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          overflowY: 'auto',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {format(selectedDay, 'EEEE', { locale: fr })}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em' }}>
              {format(selectedDay, 'd MMMM', { locale: fr })}
            </div>
          </div>

          <button
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={13} /> Ajouter une note
          </button>

          {selectedDayNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              Aucune note ce jour
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedDayNotes.map(note => (
                <div key={note.id} className="note-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[note.priority] }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'white', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {note.title || 'Sans titre'}
                    </span>
                  </div>
                  {note.time && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                      <Clock size={10} /> {note.time}
                    </div>
                  )}
                  {note.checklist.length > 0 && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                      ✓ {note.checklist.filter(c => c.done).length}/{note.checklist.length} tâches
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <NoteModal
          onClose={() => setShowModal(false)}
          defaultDate={selectedDayStr}
        />
      )}
    </div>
  );
}

function AgendaItem({ note, index }: { note: Note; index: number }) {
  const priorityColors: Record<Priority, string> = {
    urgent: '#f87171', high: '#fb923c', medium: '#facc15', low: '#4ade80',
  };
  return (
    <div
      className="note-card animate-fade-up"
      style={{ animationDelay: `${index * 0.03}s`, display: 'flex', gap: 16, alignItems: 'flex-start' }}
    >
      <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 48 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
          {format(new Date(note.date! + 'T00:00:00'), 'd')}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {format(new Date(note.date! + 'T00:00:00'), 'MMM', { locale: fr })}
        </div>
      </div>
      <div style={{ width: 2, background: priorityColors[note.priority], borderRadius: 1, alignSelf: 'stretch', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 2 }}>{note.title || 'Sans titre'}</div>
        {note.content && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.content}</div>}
        {note.time && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            <Clock size={10} /> {note.time}
          </div>
        )}
      </div>
    </div>
  );
}
