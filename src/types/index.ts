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
    | 'bulleted-list'
    | 'notecard-embed';
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

// Notecard interface
export interface Notecard {
  id: string;
  user_id: string;
  front: string;
  back: string;
  createdAt: Date;
  updatedAt: Date;
}

// Spaced repetition interfaces
export interface NotecardReviewStats {
  id: string;
  notecard_id: string; // Foreign key to notecards table
  user_id: string; // For data isolation
  easinessFactor: number; // SM-2 ease factor
  intervalDays: number; // Current interval
  repetitions: number; // Number of successful reviews
  nextReviewDate: Date; // When card is due
  lastReviewDate: Date | null; // Last review timestamp (null for new cards)
  totalReviews: number; // Total review count
  correctReviews: number; // Successful reviews
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewSession {
  id: string;
  user_id: string;
  startTime: Date;
  endTime: Date | null;
  cardsReviewed: number;
  cardsCorrect: number;
  createdAt: Date;
  updatedAt: Date;
}

// Database versions for serialization
export interface DatabaseNotecardReviewStats {
  id: string;
  notecard_id: string;
  user_id: string;
  easiness_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string; // ISO date string
  last_review_date: string | null; // ISO date string
  total_reviews: number;
  correct_reviews: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface DatabaseReviewSession {
  id: string;
  user_id: string;
  start_time: string; // ISO date string
  end_time: string | null; // ISO date string
  cards_reviewed: number;
  cards_correct: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

// Review result types
export type ReviewResult = 'correct' | 'wrong';

// Review card with stats
export interface ReviewCard {
  notecard: Notecard;
  reviewStats: NotecardReviewStats;
}

// Custom Slate element for embedding notecards
export interface NotecardEmbedElement extends BaseCustomElement {
  type: 'notecard-embed';
  notecardId: string;
  children: [{ text: '' }]; // Required by Slate, even for void elements
}

// Union type for all custom elements
export type CustomElement = TextElement | ListElement | NotecardEmbedElement;

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
  user_id: string;
  title: string;
  content: CustomElement[]; // Slate.js nodes for rich text
  createdAt: Date;
  updatedAt: Date;
}

// Database-related types
export interface DatabaseNote {
  id: string;
  user_id: string;
  title: string;
  content: string; // JSON serialized SlateJS nodes
  createdAt: string; // ISO date string for storage
  updatedAt: string; // ISO date string for storage
}

export interface DatabaseNotecard {
  id: string;
  user_id: string;
  front: string;
  back: string;
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
  getAllNotes: (userId: string) => Promise<Note[]>;
  getNoteById: (id: string, userId: string) => Promise<Note | undefined>;
  createNote: (note: CreateNoteInput, userId: string) => Promise<Note>;
  updateNote: (
    id: string,
    updates: UpdateNoteInput,
    userId: string
  ) => Promise<Note>;
  deleteNote: (id: string, userId: string) => Promise<void>;
  searchNotes: (query: string, userId: string) => Promise<Note[]>;
}

// Notecard database operations interface
export interface NotecardsDatabase {
  getAllNotecards: (userId: string) => Promise<Notecard[]>;
  getNotecardById: (
    id: string,
    userId: string
  ) => Promise<Notecard | undefined>;
  createNotecard: (
    notecard: CreateNotecardInput,
    userId: string
  ) => Promise<Notecard>;
  updateNotecard: (
    id: string,
    updates: UpdateNotecardInput,
    userId: string
  ) => Promise<Notecard>;
  deleteNotecard: (id: string, userId: string) => Promise<void>;
  searchNotecards: (query: string, userId: string) => Promise<Notecard[]>;
}

// Spaced repetition database operations interface
export interface SpacedRepetitionDatabase {
  // Review stats operations
  getReviewStats: (
    notecardId: string,
    userId: string
  ) => Promise<NotecardReviewStats | undefined>;
  createReviewStats: (
    notecardId: string,
    userId: string
  ) => Promise<NotecardReviewStats>;
  updateReviewStats: (
    id: string,
    updates: Partial<NotecardReviewStats>
  ) => Promise<NotecardReviewStats>;

  // Review queue operations
  getDueCards: (userId: string, limit?: number) => Promise<ReviewCard[]>;
  getNewCards: (userId: string, limit?: number) => Promise<ReviewCard[]>;

  // Review session operations
  createReviewSession: (userId: string) => Promise<ReviewSession>;
  updateReviewSession: (
    id: string,
    updates: Partial<ReviewSession>
  ) => Promise<ReviewSession>;
  getReviewSessions: (
    userId: string,
    limit?: number
  ) => Promise<ReviewSession[]>;

  // Statistics
  getReviewStatistics: (userId: string) => Promise<{
    totalCards: number;
    dueCards: number;
    newCards: number;
    retentionRate: number;
  }>;
}

// Utility types - user_id is passed separately in database operations
export type CreateNoteInput = Omit<
  Note,
  'id' | 'user_id' | 'createdAt' | 'updatedAt'
>;
export type UpdateNoteInput = Partial<
  Omit<Note, 'id' | 'user_id' | 'createdAt'>
>;

export type CreateNotecardInput = Omit<
  Notecard,
  'id' | 'user_id' | 'createdAt' | 'updatedAt'
>;
export type UpdateNotecardInput = Partial<
  Omit<Notecard, 'id' | 'user_id' | 'createdAt'>
>;

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
