import React, { useState, useEffect } from 'react';
import { Search, Plus, Brain, LogOut } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/useAuth';

interface NavbarProps {
  onNewNote: () => void;
}

export function Navbar({ onNewNote }: NavbarProps) {
  const { searchQuery, setSearchQuery } = useApp();
  const { logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className="navbar"
      style={{
        boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.4)' : 'none',
        transition: 'box-shadow 300ms',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={16} color="white" />
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', color: 'white' }}>
          MindVault
        </span>
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
        <Search
          size={14}
          style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
          }}
        />
        <input
          className="input-premium"
          style={{ paddingLeft: 36, height: 36, fontSize: 13 }}
          placeholder="Rechercher notes, tâches, tags..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn-primary" onClick={onNewNote} style={{ height: 36, fontSize: 13 }}>
          <Plus size={14} />
          Nouvelle note
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
              logout();
            }
          }}
          title="Déconnexion"
          style={{ height: 36, fontSize: 13, padding: '0 10px' }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </nav>
  );
}
