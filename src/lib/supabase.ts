import { createClient } from '@supabase/supabase-js';
import type {
  Note,
  Notecard,
  CreateNoteInput,
  CreateNotecardInput,
  UpdateNoteInput,
  UpdateNotecardInput,
  CustomElement,
} from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Type definitions for database tables (matching migration schema)
export interface DatabaseNote {
  id: string;
  user_id: string;
  title: string;
  content: unknown[]; // SlateJS content (stored as JSONB)
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface DatabaseNotecard {
  id: string;
  user_id: string;
  front_content: unknown[]; // SlateJS content (stored as JSONB) - will be simple text for now
  back_content: unknown[]; // SlateJS content (stored as JSONB) - will be simple text for now
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

// Database schema type
export interface Database {
  public: {
    Tables: {
      notes: {
        Row: DatabaseNote;
        Insert: Omit<DatabaseNote, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseNote, 'id' | 'created_at' | 'updated_at'>>;
      };
      notecards: {
        Row: DatabaseNotecard;
        Insert: Omit<DatabaseNotecard, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<
          Omit<DatabaseNotecard, 'id' | 'created_at' | 'updated_at'>
        >;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
        };
        Update: {
          email?: string;
        };
      };
    };
  };
}

// Helper functions to convert between app format and database format
// For now, we'll store simple text as JSONB with a single paragraph element

const stringToSlateContent = (text: string): CustomElement[] => [
  {
    type: 'paragraph',
    children: [{ text }],
  },
];

const slateContentToString = (content: unknown[]): string => {
  // Extract text from Slate content - for now, just get the first paragraph's text
  if (!content || !Array.isArray(content) || content.length === 0) return '';

  const firstElement = content[0] as CustomElement;
  if ('children' in firstElement && Array.isArray(firstElement.children)) {
    return firstElement.children
      .map((child) => ('text' in child ? child.text || '' : ''))
      .join('');
  }

  return '';
};

// Serialization functions
const serializeNoteForSupabase = (
  note: Note
): Omit<DatabaseNote, 'id' | 'created_at' | 'updated_at'> => ({
  user_id: note.user_id,
  title: note.title,
  content: note.content,
  is_deleted: false,
});

const deserializeNoteFromSupabase = (dbNote: DatabaseNote): Note => ({
  id: dbNote.id,
  user_id: dbNote.user_id,
  title: dbNote.title,
  content: dbNote.content as CustomElement[],
  createdAt: new Date(dbNote.created_at),
  updatedAt: new Date(dbNote.updated_at),
});

const serializeNotecardForSupabase = (
  notecard: Notecard
): Omit<DatabaseNotecard, 'id' | 'created_at' | 'updated_at'> => ({
  user_id: notecard.user_id,
  front_content: stringToSlateContent(notecard.front),
  back_content: stringToSlateContent(notecard.back),
  is_deleted: false,
});

const deserializeNotecardFromSupabase = (
  dbNotecard: DatabaseNotecard
): Notecard => ({
  id: dbNotecard.id,
  user_id: dbNotecard.user_id,
  front: slateContentToString(dbNotecard.front_content),
  back: slateContentToString(dbNotecard.back_content),
  createdAt: new Date(dbNotecard.created_at),
  updatedAt: new Date(dbNotecard.updated_at),
});

// Notes database operations
export const supabaseNotesDatabase = {
  async getAllNotes(userId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to get all notes:', error);
      throw new Error('Failed to load notes');
    }

    return data.map(deserializeNoteFromSupabase);
  },

  async getNoteById(id: string, userId: string): Promise<Note | undefined> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      console.error('Failed to get note by ID:', error);
      throw new Error('Failed to load note');
    }

    return deserializeNoteFromSupabase(data);
  },

  async createNote(noteInput: CreateNoteInput, userId: string): Promise<Note> {
    try {
      const noteData = serializeNoteForSupabase({
        id: '', // Will be generated by DB
        user_id: userId,
        ...noteInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('Creating note with data:', noteData);

      const { data, error } = await supabase
        .from('notes')
        .insert(noteData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw new Error(`Failed to create note: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from Supabase insert');
      }

      return deserializeNoteFromSupabase(data);
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error instanceof Error ? error : new Error('Failed to create note');
    }
  },

  async updateNote(
    id: string,
    updates: UpdateNoteInput,
    userId: string
  ): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) {
      console.error('Failed to update note:', error);
      throw new Error('Failed to update note');
    }

    return deserializeNoteFromSupabase(data);
  },

  async deleteNote(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to delete note:', error);
      throw new Error('Failed to delete note');
    }
  },

  async searchNotes(query: string, userId: string): Promise<Note[]> {
    if (!query.trim()) {
      return this.getAllNotes(userId);
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .or(
        `title.ilike.%${query}%,content.cs."[{\"children\":[{\"text\":\"${query}\"}]}]"`
      )
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to search notes:', error);
      throw new Error('Failed to search notes');
    }

    return data.map(deserializeNoteFromSupabase);
  },
};

// Notecards database operations
export const supabaseNotecardsDatabase = {
  async getAllNotecards(userId: string): Promise<Notecard[]> {
    const { data, error } = await supabase
      .from('notecards')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to get all notecards:', error);
      throw new Error('Failed to load notecards');
    }

    return data.map(deserializeNotecardFromSupabase);
  },

  async getNotecardById(
    id: string,
    userId: string
  ): Promise<Notecard | undefined> {
    const { data, error } = await supabase
      .from('notecards')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      console.error('Failed to get notecard by ID:', error);
      throw new Error('Failed to load notecard');
    }

    return deserializeNotecardFromSupabase(data);
  },

  async createNotecard(
    notecardInput: CreateNotecardInput,
    userId: string
  ): Promise<Notecard> {
    const notecardData = serializeNotecardForSupabase({
      id: '', // Will be generated by DB
      user_id: userId,
      ...notecardInput,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { data, error } = await supabase
      .from('notecards')
      .insert(notecardData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create notecard:', error);
      throw new Error('Failed to create notecard');
    }

    return deserializeNotecardFromSupabase(data);
  },

  async updateNotecard(
    id: string,
    updates: UpdateNotecardInput,
    userId: string
  ): Promise<Notecard> {
    // Convert string updates to JSONB content if needed
    const dbUpdates: {
      front_content?: CustomElement[];
      back_content?: CustomElement[];
    } = {};
    if ('front' in updates) {
      dbUpdates.front_content = stringToSlateContent(updates.front!);
    }
    if ('back' in updates) {
      dbUpdates.back_content = stringToSlateContent(updates.back!);
    }

    const { data, error } = await supabase
      .from('notecards')
      .update({
        ...dbUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) {
      console.error('Failed to update notecard:', error);
      throw new Error('Failed to update notecard');
    }

    return deserializeNotecardFromSupabase(data);
  },

  async deleteNotecard(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('notecards')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to delete notecard:', error);
      throw new Error('Failed to delete notecard');
    }
  },

  async searchNotecards(query: string, userId: string): Promise<Notecard[]> {
    if (!query.trim()) {
      return this.getAllNotecards(userId);
    }

    const { data, error } = await supabase
      .from('notecards')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .or(
        `front_content.cs."[{\"children\":[{\"text\":\"${query}\"}]}]",back_content.cs."[{\"children\":[{\"text\":\"${query}\"}]}]"`
      )
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to search notecards:', error);
      throw new Error('Failed to search notecards');
    }

    return data.map(deserializeNotecardFromSupabase);
  },
};

// Test connection function to help debug issues
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log(
      'Anon Key (first 20 chars):',
      supabaseAnonKey?.substring(0, 20) + '...'
    );

    // Test basic connection with a simple select
    const { data, error } = await supabase.from('notes').select('id').limit(1);

    if (error) {
      console.error('Connection test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('Connection test successful:', data);
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Connection test exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
