import { Descendant } from 'slate';

export interface Note {
  id: string;
  title: string;
  content: Descendant[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface AppState {
  notes: Note[];
  activeNoteId: string | null;
  sidebarCollapsed: boolean;
} 