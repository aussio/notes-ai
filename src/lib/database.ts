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
  title: note.title,
  content: JSON.stringify(note.content),
  createdAt: note.createdAt.toISOString(),
  updatedAt: note.updatedAt.toISOString(),
});

const deserializeNote = (dbNote: DatabaseNote): Note => ({
  id: dbNote.id,
  title: dbNote.title,
  content: JSON.parse(dbNote.content) as CustomElement[],
  createdAt: new Date(dbNote.createdAt),
  updatedAt: new Date(dbNote.updatedAt),
});

// Notecard serialization functions
const serializeNotecard = (notecard: Notecard): DatabaseNotecard => ({
  id: notecard.id,
  front: notecard.front,
  back: notecard.back,
  createdAt: notecard.createdAt.toISOString(),
  updatedAt: notecard.updatedAt.toISOString(),
});

const deserializeNotecard = (dbNotecard: DatabaseNotecard): Notecard => ({
  id: dbNotecard.id,
  front: dbNotecard.front,
  back: dbNotecard.back,
  createdAt: new Date(dbNotecard.createdAt),
  updatedAt: new Date(dbNotecard.updatedAt),
});

// Database operations implementation
export const notesDatabase: NotesDatabase = {
  async getAllNotes(): Promise<Note[]> {
    try {
      const dbNotes = await db.notes.orderBy('updatedAt').reverse().toArray();
      return dbNotes.map(deserializeNote);
    } catch (error) {
      console.error('Failed to get all notes:', error);
      throw new Error('Failed to load notes');
    }
  },

  async getNoteById(id: string): Promise<Note | undefined> {
    try {
      const dbNote = await db.notes.get(id);
      return dbNote ? deserializeNote(dbNote) : undefined;
    } catch (error) {
      console.error('Failed to get note by ID:', error);
      throw new Error('Failed to load note');
    }
  },

  async createNote(noteInput: CreateNoteInput): Promise<Note> {
    try {
      const now = new Date();
      const newNote: Note = {
        id: generateId(),
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

  async updateNote(id: string, updates: UpdateNoteInput): Promise<Note> {
    try {
      const existingDbNote = await db.notes.get(id);
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
      throw new Error('Failed to update note');
    }
  },

  async deleteNote(id: string): Promise<void> {
    try {
      const existingNote = await db.notes.get(id);
      if (!existingNote) {
        throw new Error('Note not found');
      }
      await db.notes.delete(id);
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw new Error('Failed to delete note');
    }
  },

  async searchNotes(query: string): Promise<Note[]> {
    try {
      if (!query.trim()) {
        return this.getAllNotes();
      }

      const searchTerm = query.toLowerCase();
      const dbNotes = await db.notes.toArray();

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
  async getAllNotecards(): Promise<Notecard[]> {
    try {
      const dbNotecards = await db.notecards
        .orderBy('updatedAt')
        .reverse()
        .toArray();
      return dbNotecards.map(deserializeNotecard);
    } catch (error) {
      console.error('Failed to get all notecards:', error);
      throw new Error('Failed to load notecards');
    }
  },

  async getNotecardById(id: string): Promise<Notecard | undefined> {
    try {
      const dbNotecard = await db.notecards.get(id);
      return dbNotecard ? deserializeNotecard(dbNotecard) : undefined;
    } catch (error) {
      console.error('Failed to get notecard by ID:', error);
      throw new Error('Failed to load notecard');
    }
  },

  async createNotecard(notecardInput: CreateNotecardInput): Promise<Notecard> {
    try {
      const now = new Date();
      const newNotecard: Notecard = {
        id: generateId(),
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
    updates: UpdateNotecardInput
  ): Promise<Notecard> {
    try {
      const existingDbNotecard = await db.notecards.get(id);
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

  async deleteNotecard(id: string): Promise<void> {
    try {
      const existingNotecard = await db.notecards.get(id);
      if (!existingNotecard) {
        throw new Error('Notecard not found');
      }
      await db.notecards.delete(id);
    } catch (error) {
      console.error('Failed to delete notecard:', error);
      throw new Error('Failed to delete notecard');
    }
  },

  async searchNotecards(query: string): Promise<Notecard[]> {
    try {
      if (!query.trim()) {
        return this.getAllNotecards();
      }

      const searchTerm = query.toLowerCase();
      const dbNotecards = await db.notecards.toArray();

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
