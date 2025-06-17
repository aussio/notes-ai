import type { NotesDatabase, NotecardsDatabase } from '../types';
import { notesDatabase, notecardsDatabase } from './database';

// Simplified database adapter - always use IndexedDB for immediate operations
// Cloud sync will be handled by the dedicated sync service
export const databaseAdapter: {
  notes: NotesDatabase;
  notecards: NotecardsDatabase;
} = {
  notes: notesDatabase,
  notecards: notecardsDatabase,
};

// Export convenience functions
export const { notes: notesDB, notecards: notecardsDB } = databaseAdapter;
