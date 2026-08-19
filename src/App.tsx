import React, { useState } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { useAuth } from './store/useAuth';
import { Navbar } from './components/ui/Navbar';
import { Sidebar } from './components/ui/Sidebar';
import { Dashboard } from './components/ui/Dashboard';
import { NotesView } from './components/notes/NotesView';
import { CalendarView } from './components/calendar/CalendarView';
import { AIView } from './components/ai/AIView';
import { FilesView } from './components/files/FilesView';
import { ExportView } from './components/export/ExportView';
import { TransferView } from './components/transfer/TransferView';
import { NoteModal } from './components/notes/NoteModal';
import { LoginPage } from './components/auth/LoginPage';
import { CustomCursor } from './components/ui/CustomCursor';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { currentView } = useApp();
  const [showNewNote, setShowNewNote] = useState(false);

  // Si pas authentifié, afficher la page de login
  if (!isAuthenticated) {
    return (
      <>
        <CustomCursor />
        <LoginPage />
      </>
    );
  }

  // Sinon, afficher l'application complète
  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onNewNote={() => setShowNewNote(true)} />;
      case 'notes':     return <NotesView />;
      case 'calendar':  return <CalendarView />;
      case 'ai':        return <AIView />;
      case 'files':     return <FilesView />;
      case 'export':    return <ExportView />;
      case 'transfer':  return <TransferView />;
      default:          return <Dashboard onNewNote={() => setShowNewNote(true)} />;
    }
  };

  return (
    <>
      <CustomCursor />
      <Navbar onNewNote={() => setShowNewNote(true)} />

      <div style={{
        display: 'flex',
        height: '100vh',
        paddingTop: 60,
        background: '#0A0A0A',
      }}>
        <div style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.04) 0%, transparent 60%)',
        }} />

        <Sidebar />

        <main style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1,
        }}>
          <div key={currentView} className="animate-fade-up" style={{ minHeight: '100%' }}>
            {renderView()}
          </div>
        </main>
      </div>

      {showNewNote && (
        <NoteModal onClose={() => setShowNewNote(false)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
