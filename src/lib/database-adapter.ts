import type { NotesDatabase, NotecardsDatabase } from '../types';
import { notesDatabase, notecardsDatabase } from './database';
import { supabaseNotesDatabase, supabaseNotecardsDatabase } from './supabase';

// Configuration for which database to use
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';

// Database adapter that switches between local and cloud storage
export const databaseAdapter: {
  notes: NotesDatabase;
  notecards: NotecardsDatabase;
} = {
  notes: USE_SUPABASE ? supabaseNotesDatabase : notesDatabase,
  notecards: USE_SUPABASE ? supabaseNotecardsDatabase : notecardsDatabase,
};

// Export convenience functions
export const { notes: notesDB, notecards: notecardsDB } = databaseAdapter;
