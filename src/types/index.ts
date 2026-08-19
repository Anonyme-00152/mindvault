export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type Category = 'work' | 'personal' | 'health' | 'finance' | 'ideas' | 'other';
export type FileType = 'image' | 'video' | 'document' | 'other';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface NoteFile {
  id: string;
  name: string;
  type: FileType;
  size: number;
  dataUrl: string; // base64 stored locally
  mimeType: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  checklist: ChecklistItem[];
  files: NoteFile[];
  date?: string; // ISO date string YYYY-MM-DD
  time?: string; // HH:MM
  priority: Priority;
  category: Category;
  color?: string;
  coverImage?: string; // dataUrl
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type View = 'dashboard' | 'notes' | 'calendar' | 'ai' | 'files' | 'export' | 'transfer';
