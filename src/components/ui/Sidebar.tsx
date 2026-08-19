import React from 'react';
import {
  LayoutDashboard, StickyNote, CalendarDays, Bot, FolderOpen, Download, ArrowRightLeft
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import type { View } from '../../types';

const navItems: { id: View; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: <LayoutDashboard size={16} /> },
  { id: 'notes',      label: 'Notes',       icon: <StickyNote size={16} /> },
  { id: 'calendar',   label: 'Calendrier',  icon: <CalendarDays size={16} /> },
  { id: 'ai',         label: 'Assistant IA',icon: <Bot size={16} /> },
  { id: 'files',      label: 'Fichiers',    icon: <FolderOpen size={16} /> },
  { id: 'export',     label: 'Export',      icon: <Download size={16} /> },
  { id: 'transfer',   label: 'Transfert',   icon: <ArrowRightLeft size={16} /> },
];

export function Sidebar() {
  const { currentView, setCurrentView, notes } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = notes.filter(n => n.date === todayStr).length;

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      padding: '16px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      borderRight: '1px solid rgba(255,255,255,0.06)',
      height: '100%',
      overflowY: 'auto',
    }}>
      {/* Stats */}
      <div style={{
        padding: '12px 14px',
        marginBottom: 8,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Aujourd'hui
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'white', letterSpacing: '-0.03em' }}>
          {todayCount}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          {todayCount === 1 ? 'note planifiée' : 'notes planifiées'}
        </div>
      </div>

      <div className="divider" style={{ marginBottom: 8 }} />

      {navItems.map(item => (
        <div
          key={item.id}
          className={`sidebar-item ${currentView === item.id ? 'active' : ''}`}
          onClick={() => setCurrentView(item.id)}
        >
          {item.icon}
          <span style={{ flex: 1 }}>{item.label}</span>
          {item.id === 'notes' && notes.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600,
              background: 'rgba(255,255,255,0.08)',
              padding: '1px 7px', borderRadius: 999,
              color: 'rgba(255,255,255,0.5)',
            }}>
              {notes.length}
            </span>
          )}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      {/* Bottom info */}
      <div style={{
        padding: '10px 14px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
          Stockage 100% local<br />
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>Aucune donnée envoyée</span>
        </div>
      </div>
    </aside>
  );
}
