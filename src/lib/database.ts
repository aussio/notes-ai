import Dexie, { Table } from 'dexie';
import type {
  Note,
  DatabaseNote,
  Notecard,
  DatabaseNotecard,
  NotesDatabase,
  NotecardsDatabase,
  CreateNoteInput,
  UpdateNoteInput,
  CreateNotecardInput,
  UpdateNotecardInput,
  CustomElement,
  TextElement,
  ListElement,
} from '../types';

// Dexie database class with TypeScript integration
class NotesDB extends Dexie {
  notes!: Table<DatabaseNote>;
  notecards!: Table<DatabaseNotecard>;

  constructor() {
    super('NotesDatabase');

    // Define database schema
    this.version(1).stores({
      notes: 'id, title, createdAt, updatedAt', // Indexed fields
      notecards: 'id, front, back, createdAt, updatedAt', // Indexed fields
    });

    // Version 2: Add user_id support with indexes
    this.version(2).stores({
      notes:
        'id, user_id, title, createdAt, updatedAt, [user_id+updatedAt], [id+user_id]', // Added user_id and compound indexes
      notecards:
        'id, user_id, front, back, createdAt, updatedAt, [user_id+updatedAt], [id+user_id]', // Added user_id and compound indexes
    });
  }
}

// Create database instance
const db = new NotesDB();

// Helper function to generate unique IDs
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Utility functions for data transformation
const serializeNote = (note: Note): DatabaseNote => ({
  id: note.id,
  user_id: note.user_id,
  title: note.title,
  content: JSON.stringify(note.content),
  createdAt: note.createdAt.toISOString(),
  updatedAt: note.updatedAt.toISOString(),
});

const deserializeNote = (dbNote: DatabaseNote): Note => ({
  id: dbNote.id,
  user_id: dbNote.user_id,
  title: dbNote.title,
  content: JSON.parse(dbNote.content) as CustomElement[],
  createdAt: new Date(dbNote.createdAt),
  updatedAt: new Date(dbNote.updatedAt),
});

// Notecard serialization functions
const serializeNotecard = (notecard: Notecard): DatabaseNotecard => ({
  id: notecard.id,
  user_id: notecard.user_id,
  front: notecard.front,
  back: notecard.back,
  createdAt: notecard.createdAt.toISOString(),
  updatedAt: notecard.updatedAt.toISOString(),
});

const deserializeNotecard = (dbNotecard: DatabaseNotecard): Notecard => ({
  id: dbNotecard.id,
  user_id: dbNotecard.user_id,
  front: dbNotecard.front,
  back: dbNotecard.back,
  createdAt: new Date(dbNotecard.createdAt),
  updatedAt: new Date(dbNotecard.updatedAt),
});

// Database operations implementation
export const notesDatabase: NotesDatabase = {
  async getAllNotes(userId: string): Promise<Note[]> {
    try {
      const dbNotes = await db.notes.where('user_id').equals(userId).toArray();
      // Sort by updatedAt in descending order (most recent first)
      const sortedNotes = dbNotes.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      return sortedNotes.map(deserializeNote);
    } catch (error) {
      console.error('Failed to get all notes:', error);
      throw new Error('Failed to load notes');
    }
  },

  async getNoteById(id: string, userId: string): Promise<Note | undefined> {
    try {
      const dbNote = await db.notes.where({ id, user_id: userId }).first();
      return dbNote ? deserializeNote(dbNote) : undefined;
    } catch (error) {
      console.error('Failed to get note by ID:', error);
      throw new Error('Failed to load note');
    }
  },

  async createNote(noteInput: CreateNoteInput, userId: string): Promise<Note> {
    try {
      const now = new Date();
      const newNote: Note = {
        id: generateId(),
        user_id: userId,
        title: noteInput.title,
        content: noteInput.content,
        createdAt: now,
        updatedAt: now,
      };

      const dbNote = serializeNote(newNote);
      await db.notes.add(dbNote);

      return newNote;
    } catch (error) {
      console.error('Failed to create note:', error);
      throw new Error('Failed to create note');
    }
  },

  async updateNote(
    id: string,
    updates: UpdateNoteInput,
    userId: string
  ): Promise<Note> {
    try {
      const existingDbNote = await db.notes
        .where({ id, user_id: userId })
        .first();
      if (!existingDbNote) {
        throw new Error('Note not found');
      }

      const existingNote = deserializeNote(existingDbNote);
      const updatedNote: Note = {
        ...existingNote,
        ...updates,
        updatedAt: new Date(),
      };

      const dbNote = serializeNote(updatedNote);
      await db.notes.update(id, dbNote);

      return updatedNote;
    } catch (error) {
      console.error('Failed to update note:', error);
      if (error instanceof Error && error.message === 'Note not found') {
        throw error;
      }
      throw new Error('Failed to update note');
    }
  },

  async deleteNote(id: string, userId: string): Promise<void> {
    try {
      const deletedCount = await db.notes
        .where({ id, user_id: userId })
        .delete();
      if (deletedCount === 0) {
        throw new Error('Note not found');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      if (error instanceof Error && error.message === 'Note not found') {
        throw error;
      }
      throw new Error('Failed to delete note');
    }
  },

  async searchNotes(query: string, userId: string): Promise<Note[]> {
    try {
      if (!query.trim()) {
        return this.getAllNotes(userId);
      }

      const searchTerm = query.toLowerCase();
      const dbNotes = await db.notes.where('user_id').equals(userId).toArray();

      const filteredNotes = dbNotes.filter((dbNote) => {
        // Search in title
        const titleMatch = dbNote.title.toLowerCase().includes(searchTerm);

        // Search in content (parse JSON and extract text)
        let contentMatch = false;
        try {
          const content = JSON.parse(dbNote.content) as CustomElement[];
          const contentText = extractTextFromSlateContent(content);
          contentMatch = contentText.toLowerCase().includes(searchTerm);
        } catch {
          // If content parsing fails, skip content search
        }

        return titleMatch || contentMatch;
      });

      return filteredNotes
        .map(deserializeNote)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Failed to search notes:', error);
      throw new Error('Failed to search notes');
    }
  },
};

// Helper function to extract plain text from Slate content for search
function extractTextFromSlateContent(content: CustomElement[]): string {
  return content
    .map((element) => {
      if (
        element.type === 'bulleted-list' ||
        element.type === 'numbered-list'
      ) {
        // For list containers, recursively extract text from their children
        const listElement = element as ListElement;
        return extractTextFromSlateContent(listElement.children);
      } else {
        // For text containers, extract text from CustomText children
        const textElement = element as TextElement;
        return textElement.children.map((child) => child.text).join(' ');
      }
    })
    .join(' ');
}

// Notecard database operations
export const notecardsDatabase: NotecardsDatabase = {
  async getAllNotecards(userId: string): Promise<Notecard[]> {
    try {
      const dbNotecards = await db.notecards
        .where('user_id')
        .equals(userId)
        .toArray();
      // Sort by updatedAt in descending order (most recent first)
      const sortedNotecards = dbNotecards.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      return sortedNotecards.map(deserializeNotecard);
    } catch (error) {
      console.error('Failed to get all notecards:', error);
      throw new Error('Failed to load notecards');
    }
  },

  async getNotecardById(
    id: string,
    userId: string
  ): Promise<Notecard | undefined> {
    try {
      const dbNotecard = await db.notecards
        .where({ id, user_id: userId })
        .first();
      return dbNotecard ? deserializeNotecard(dbNotecard) : undefined;
    } catch (error) {
      console.error('Failed to get notecard by ID:', error);
      throw new Error('Failed to load notecard');
    }
  },

  async createNotecard(
    notecardInput: CreateNotecardInput,
    userId: string
  ): Promise<Notecard> {
    try {
      const now = new Date();
      const newNotecard: Notecard = {
        id: generateId(),
        user_id: userId,
        front: notecardInput.front,
        back: notecardInput.back,
        createdAt: now,
        updatedAt: now,
      };

      const dbNotecard = serializeNotecard(newNotecard);
      await db.notecards.add(dbNotecard);

      return newNotecard;
    } catch (error) {
      console.error('Failed to create notecard:', error);
      throw new Error('Failed to create notecard');
    }
  },

  async updateNotecard(
    id: string,
    updates: UpdateNotecardInput,
    userId: string
  ): Promise<Notecard> {
    try {
      const existingDbNotecard = await db.notecards
        .where({ id, user_id: userId })
        .first();
      if (!existingDbNotecard) {
        throw new Error('Notecard not found');
      }

      const existingNotecard = deserializeNotecard(existingDbNotecard);
      const updatedNotecard: Notecard = {
        ...existingNotecard,
        ...updates,
        updatedAt: new Date(),
      };

      const dbNotecard = serializeNotecard(updatedNotecard);
      await db.notecards.update(id, dbNotecard);

      return updatedNotecard;
    } catch (error) {
      console.error('Failed to update notecard:', error);
      throw new Error('Failed to update notecard');
    }
  },

  async deleteNotecard(id: string, userId: string): Promise<void> {
    try {
      const deletedCount = await db.notecards
        .where({ id, user_id: userId })
        .delete();
      if (deletedCount === 0) {
        throw new Error('Notecard not found');
      }

      // Cascade cleanup: Delete associated review stats from spaced repetition database
      try {
        const { cleanupNotecardReviewStats } = await import(
          '@/lib/spaced-repetition/database'
        );
        await cleanupNotecardReviewStats(id, userId);
      } catch (error) {
        // Don't fail the main operation if cleanup fails, just log it
        console.warn(
          'Failed to cleanup review stats for deleted notecard:',
          error
        );
      }
    } catch (error) {
      console.error('Failed to delete notecard:', error);
      throw new Error('Failed to delete notecard');
    }
  },

  async searchNotecards(query: string, userId: string): Promise<Notecard[]> {
    try {
      if (!query.trim()) {
        return this.getAllNotecards(userId);
      }

      const searchTerm = query.toLowerCase();
      const dbNotecards = await db.notecards
        .where('user_id')
        .equals(userId)
        .toArray();

      const filteredNotecards = dbNotecards.filter((dbNotecard) => {
        const frontMatch = dbNotecard.front.toLowerCase().includes(searchTerm);
        const backMatch = dbNotecard.back.toLowerCase().includes(searchTerm);
        return frontMatch || backMatch;
      });

      return filteredNotecards
        .map(deserializeNotecard)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Failed to search notecards:', error);
      throw new Error('Failed to search notecards');
    }
  },
};

// Export database instance for advanced usage if needed
export { db };
