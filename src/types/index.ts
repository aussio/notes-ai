import { BaseEditor } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';

// Extend Slate's types for our custom editor
export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

// Base element interface
export interface BaseCustomElement {
  type:
    | 'paragraph'
    | 'heading'
    | 'list-item'
    | 'numbered-list'
    | 'bulleted-list';
  level?: 1 | 2 | 3; // For headings
  indent?: number; // For list item indentation levels
}

// Text container elements (paragraph, heading, list-item)
export interface TextElement extends BaseCustomElement {
  type: 'paragraph' | 'heading' | 'list-item';
  children: CustomText[];
}

// List container elements (bulleted-list, numbered-list)
export interface ListElement extends BaseCustomElement {
  type: 'bulleted-list' | 'numbered-list';
  children: TextElement[];
}

// Union type for all custom elements
export type CustomElement = TextElement | ListElement;

export interface CustomText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

// Make TypeScript recognize our custom types
declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Core Note interface - simplified from plan
export interface Note {
  id: string;
  title: string;
  content: CustomElement[]; // Slate.js nodes for rich text
  createdAt: Date;
  updatedAt: Date;
}

// Database-related types
export interface DatabaseNote {
  id: string;
  title: string;
  content: string; // JSON serialized SlateJS nodes
  createdAt: string; // ISO date string for storage
  updatedAt: string; // ISO date string for storage
}

// Application state types
export interface NotesState {
  notes: Record<string, Note>;
  activeNoteId: string | null;
  loading: boolean;
  error: string | null;
}

// Action types for state management
export type NotesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTES'; payload: Note[] }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'SET_ACTIVE_NOTE'; payload: string | null };

// Hook return types
export interface UseNotesReturn {
  state: NotesState;
  actions: {
    createNote: (title?: string) => Promise<Note>;
    updateNote: (
      id: string,
      updates: Partial<Omit<Note, 'id' | 'createdAt'>>
    ) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    setActiveNote: (id: string | null) => void;
    searchNotes: (query: string) => Note[];
  };
}

// Database operations interface
export interface NotesDatabase {
  getAllNotes: () => Promise<Note[]>;
  getNoteById: (id: string) => Promise<Note | undefined>;
  createNote: (
    note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Note>;
  updateNote: (
    id: string,
    updates: Partial<Omit<Note, 'id' | 'createdAt'>>
  ) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  searchNotes: (query: string) => Promise<Note[]>;
}

// Utility types
export type CreateNoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateNoteInput = Partial<Omit<Note, 'id' | 'createdAt'>>;

// Component prop types
export interface NoteItemProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export interface NotesListProps {
  notes: Note[];
  activeNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onNoteDelete: (id: string) => void;
  onCreateNote: () => void;
}

export interface SimpleEditorProps {
  note: Note | null;
  onChange: (content: CustomElement[]) => void;
  onTitleChange: (title: string) => void;
}

export interface AppState {
  notes: Note[];
  activeNoteId: string | null;
  sidebarCollapsed: boolean;
}
