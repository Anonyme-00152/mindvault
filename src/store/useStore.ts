import { useState, useEffect, useCallback } from 'react';
import type { Note, AIMessage, View, ChecklistItem, NoteFile } from '../types';

const STORAGE_KEY = 'mindvault_notes_v1';
const AI_STORAGE_KEY = 'mindvault_ai_v1';

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    // integrity check
    const check = localStorage.getItem(STORAGE_KEY);
    if (!check) throw new Error('Save failed');
  } catch (e) {
    console.error('Erreur de sauvegarde:', e);
  }
}

function loadAIMessages(): AIMessage[] {
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveAIMessages(msgs: AIMessage[]) {
  try {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(msgs));
  } catch {}
}

export function useStore() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [aiMessages, setAIMessages] = useState<AIMessage[]>(() => loadAIMessages());
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-save on notes change
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    saveAIMessages(aiMessages);
  }, [aiMessages]);

  const addNote = useCallback((note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    ));
    setSelectedNote(prev => prev?.id === id ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev);
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setSelectedNote(prev => prev?.id === id ? null : prev);
  }, []);

  const addChecklistItem = useCallback((noteId: string, item: ChecklistItem) => {
    setNotes(prev => prev.map(n =>
      n.id === noteId
        ? { ...n, checklist: [...n.checklist, item], updatedAt: new Date().toISOString() }
        : n
    ));
  }, []);

  const toggleChecklistItem = useCallback((noteId: string, itemId: string) => {
    setNotes(prev => prev.map(n =>
      n.id === noteId
        ? {
            ...n,
            checklist: n.checklist.map(c =>
              c.id === itemId ? { ...c, done: !c.done } : c
            ),
            updatedAt: new Date().toISOString()
          }
        : n
    ));
  }, []);

  const addFile = useCallback((noteId: string, file: NoteFile) => {
    setNotes(prev => prev.map(n =>
      n.id === noteId
        ? { ...n, files: [...n.files, file], updatedAt: new Date().toISOString() }
        : n
    ));
  }, []);

  const removeFile = useCallback((noteId: string, fileId: string) => {
    setNotes(prev => prev.map(n =>
      n.id === noteId
        ? { ...n, files: n.files.filter(f => f.id !== fileId), updatedAt: new Date().toISOString() }
        : n
    ));
  }, []);

  const addAIMessage = useCallback((msg: AIMessage) => {
    setAIMessages(prev => [...prev, msg]);
  }, []);

  const clearAIMessages = useCallback(() => {
    setAIMessages([]);
  }, []);

  const importData = useCallback((importedNotes: Note[], mode: 'replace' | 'merge' = 'replace') => {
    if (mode === 'replace') {
      setNotes(importedNotes);
    } else {
      setNotes(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNotes = importedNotes.filter(n => !existingIds.has(n.id));
        return [...prev, ...newNotes];
      });
    }
  }, []);

  const getNotesForDate = useCallback((dateStr: string) => {
    return notes.filter(n => n.date === dateStr);
  }, [notes]);

  const getTodayNotes = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return notes.filter(n => n.date === today);
  }, [notes]);

  const getFilteredNotes = useCallback(() => {
    if (!searchQuery) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [notes, searchQuery]);

  return {
    notes,
    aiMessages,
    currentView,
    selectedNote,
    searchQuery,
    setCurrentView,
    setSelectedNote,
    setSearchQuery,
    addNote,
    updateNote,
    deleteNote,
    addChecklistItem,
    toggleChecklistItem,
    addFile,
    removeFile,
    addAIMessage,
    clearAIMessages,
    getNotesForDate,
    getTodayNotes,
    getFilteredNotes,
    importData,
  };
}
