import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Type definitions for database tables
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
  front_content: unknown[]; // SlateJS content (stored as JSONB)
  back_content: unknown[]; // SlateJS content (stored as JSONB)
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
