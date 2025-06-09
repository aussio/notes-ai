import { notesDatabase } from '../lib/database';
import type { Note, CreateNoteInput } from '../types';

// Mock data for testing
const mockNoteInput: CreateNoteInput = {
  title: 'Test Note',
  content: [
    {
      type: 'paragraph',
      children: [{ text: 'This is a test note content' }],
    },
  ],
};

const mockNoteInput2: CreateNoteInput = {
  title: 'Second Note',
  content: [
    {
      type: 'paragraph',
      children: [{ text: 'This is another test note' }],
    },
  ],
};

describe('Database Operations', () => {
  let createdNote: Note;

  beforeEach(async () => {
    // Clean up any existing notes
    const existingNotes = await notesDatabase.getAllNotes();
    for (const note of existingNotes) {
      await notesDatabase.deleteNote(note.id);
    }
  });

  afterEach(async () => {
    // Clean up after each test
    const allNotes = await notesDatabase.getAllNotes();
    for (const note of allNotes) {
      await notesDatabase.deleteNote(note.id);
    }
  });

  describe('Create Note', () => {
    it('should create a new note with generated ID and timestamps', async () => {
      createdNote = await notesDatabase.createNote(mockNoteInput);

      expect(createdNote.id).toBeDefined();
      expect(createdNote.title).toBe(mockNoteInput.title);
      expect(createdNote.content).toEqual(mockNoteInput.content);
      expect(createdNote.createdAt).toBeInstanceOf(Date);
      expect(createdNote.updatedAt).toBeInstanceOf(Date);
    });

    it('should create notes with unique IDs', async () => {
      const note1 = await notesDatabase.createNote(mockNoteInput);
      const note2 = await notesDatabase.createNote(mockNoteInput2);

      expect(note1.id).not.toBe(note2.id);
    });
  });

  describe('Get Notes', () => {
    beforeEach(async () => {
      createdNote = await notesDatabase.createNote(mockNoteInput);
      await notesDatabase.createNote(mockNoteInput2);
    });

    it('should get all notes ordered by updatedAt desc', async () => {
      const notes = await notesDatabase.getAllNotes();

      expect(notes).toHaveLength(2);
      expect(notes[0].updatedAt.getTime()).toBeGreaterThanOrEqual(
        notes[1].updatedAt.getTime()
      );
    });

    it('should get note by ID', async () => {
      const retrievedNote = await notesDatabase.getNoteById(createdNote.id);

      expect(retrievedNote).toBeDefined();
      expect(retrievedNote!.id).toBe(createdNote.id);
      expect(retrievedNote!.title).toBe(createdNote.title);
      expect(retrievedNote!.content).toEqual(createdNote.content);
    });

    it('should return undefined for non-existent note ID', async () => {
      const retrievedNote = await notesDatabase.getNoteById('non-existent');

      expect(retrievedNote).toBeUndefined();
    });
  });

  describe('Update Note', () => {
    beforeEach(async () => {
      createdNote = await notesDatabase.createNote(mockNoteInput);
    });

    it('should update note title and content', async () => {
      // Add small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updates = {
        title: 'Updated Title',
        content: [
          {
            type: 'paragraph' as const,
            children: [{ text: 'Updated content' }],
          },
        ],
      };

      const updatedNote = await notesDatabase.updateNote(
        createdNote.id,
        updates
      );

      expect(updatedNote.title).toBe(updates.title);
      expect(updatedNote.content).toEqual(updates.content);
      expect(updatedNote.updatedAt.getTime()).toBeGreaterThan(
        createdNote.updatedAt.getTime()
      );
    });

    it('should throw error for non-existent note', async () => {
      await expect(
        notesDatabase.updateNote('non-existent', { title: 'New Title' })
      ).rejects.toThrow('Failed to update note');
    });
  });

  describe('Delete Note', () => {
    beforeEach(async () => {
      createdNote = await notesDatabase.createNote(mockNoteInput);
    });

    it('should delete an existing note', async () => {
      await notesDatabase.deleteNote(createdNote.id);

      const retrievedNote = await notesDatabase.getNoteById(createdNote.id);
      expect(retrievedNote).toBeUndefined();
    });

    it('should throw error when deleting non-existent note', async () => {
      // Our implementation now validates that the note exists before deleting
      await expect(notesDatabase.deleteNote('non-existent')).rejects.toThrow(
        'Failed to delete note'
      );
    });
  });

  describe('Search Notes', () => {
    beforeEach(async () => {
      await notesDatabase.createNote({
        title: 'JavaScript Tutorial',
        content: [
          {
            type: 'paragraph',
            children: [{ text: 'Learn React and TypeScript basics' }],
          },
        ],
      });

      await notesDatabase.createNote({
        title: 'Cooking Recipe',
        content: [
          {
            type: 'paragraph',
            children: [{ text: 'How to make pasta with tomato sauce' }],
          },
        ],
      });

      await notesDatabase.createNote({
        title: 'Travel Notes',
        content: [
          {
            type: 'paragraph',
            children: [{ text: 'Visit JavaScript conferences in Europe' }],
          },
        ],
      });
    });

    it('should search notes by title', async () => {
      const results = await notesDatabase.searchNotes('JavaScript');

      expect(results).toHaveLength(2); // JavaScript Tutorial and Travel Notes
      expect(results.some((note) => note.title.includes('JavaScript'))).toBe(
        true
      );
    });

    it('should search notes by content', async () => {
      const results = await notesDatabase.searchNotes('pasta');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Cooking Recipe');
    });

    it('should return all notes for empty search', async () => {
      const results = await notesDatabase.searchNotes('');

      expect(results).toHaveLength(3);
    });

    it('should return empty array for no matches', async () => {
      const results = await notesDatabase.searchNotes('nonexistent');

      expect(results).toHaveLength(0);
    });

    it('should be case insensitive', async () => {
      const results = await notesDatabase.searchNotes('JAVASCRIPT');

      expect(results).toHaveLength(2);
    });
  });
});
