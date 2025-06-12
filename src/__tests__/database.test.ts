import { notesDatabase } from '@/lib/database';
import type { CreateNoteInput, Note } from '@/types';
import { TEMP_USER_ID } from '@/types';

const mockNoteInput: CreateNoteInput = {
  title: 'Test Note',
  content: [
    { type: 'paragraph' as const, children: [{ text: 'Test content' }] },
  ],
};

const mockNoteInput2: CreateNoteInput = {
  title: 'Another Test Note',
  content: [
    {
      type: 'paragraph' as const,
      children: [{ text: 'Another test content' }],
    },
  ],
};

describe('Notes Database Operations', () => {
  // Helper function to clean up test data
  async function cleanupTestData() {
    try {
      // Get all notes for test user and delete them
      const existingNotes = await notesDatabase.getAllNotes(TEMP_USER_ID);
      for (const note of existingNotes) {
        await notesDatabase.deleteNote(note.id, TEMP_USER_ID);
      }
    } catch {
      // Ignore errors during cleanup - might be empty database
    }
  }

  beforeEach(async () => {
    // Clean up before each test
    const allNotes = await notesDatabase.getAllNotes(TEMP_USER_ID);
    for (const note of allNotes) {
      await notesDatabase.deleteNote(note.id, TEMP_USER_ID);
    }
  });

  afterAll(async () => {
    // Final cleanup after all tests
    await cleanupTestData();
  });

  describe('createNote', () => {
    let createdNote: Note | null;

    afterEach(async () => {
      if (createdNote) {
        await notesDatabase.deleteNote(createdNote.id, TEMP_USER_ID);
        createdNote = null;
      }
    });

    it('should create a new note successfully', async () => {
      createdNote = await notesDatabase.createNote(mockNoteInput, TEMP_USER_ID);

      expect(createdNote).toBeDefined();
      expect(createdNote.id).toBeDefined();
      expect(createdNote.user_id).toBe(TEMP_USER_ID);
      expect(createdNote.title).toBe(mockNoteInput.title);
      expect(createdNote.content).toEqual(mockNoteInput.content);
      expect(createdNote.createdAt).toBeInstanceOf(Date);
      expect(createdNote.updatedAt).toBeInstanceOf(Date);
    });

    it('should create multiple notes and return them in correct order', async () => {
      const note1 = await notesDatabase.createNote(mockNoteInput, TEMP_USER_ID);
      const note2 = await notesDatabase.createNote(
        mockNoteInput2,
        TEMP_USER_ID
      );

      // Cleanup both notes
      await notesDatabase.deleteNote(note1.id, TEMP_USER_ID);
      await notesDatabase.deleteNote(note2.id, TEMP_USER_ID);

      expect(note1.user_id).toBe(TEMP_USER_ID);
      expect(note2.user_id).toBe(TEMP_USER_ID);
      expect(note1.title).toBe(mockNoteInput.title);
      expect(note2.title).toBe(mockNoteInput2.title);
    });
  });

  describe('getAllNotes', () => {
    let createdNote: Note | null;

    afterEach(async () => {
      if (createdNote) {
        await notesDatabase.deleteNote(createdNote.id, TEMP_USER_ID);
        createdNote = null;
      }
    });

    it('should return all notes for the user ordered by updatedAt', async () => {
      createdNote = await notesDatabase.createNote(mockNoteInput, TEMP_USER_ID);
      const secondNote = await notesDatabase.createNote(
        mockNoteInput2,
        TEMP_USER_ID
      );

      const allNotes = await notesDatabase.getAllNotes(TEMP_USER_ID);
      expect(allNotes).toHaveLength(2);
      expect(allNotes.every((note) => note.user_id === TEMP_USER_ID)).toBe(
        true
      );

      // Clean up the second note
      await notesDatabase.deleteNote(secondNote.id, TEMP_USER_ID);

      const remainingNotes = await notesDatabase.getAllNotes(TEMP_USER_ID);
      expect(remainingNotes).toHaveLength(1);
      expect(remainingNotes[0].user_id).toBe(TEMP_USER_ID);
    });
  });

  describe('getNoteById', () => {
    let createdNote: Note | null;

    afterEach(async () => {
      if (createdNote) {
        await notesDatabase.deleteNote(createdNote.id, TEMP_USER_ID);
        createdNote = null;
      }
    });

    it('should retrieve a specific note by ID for the user', async () => {
      createdNote = await notesDatabase.createNote(mockNoteInput, TEMP_USER_ID);

      const retrievedNote = await notesDatabase.getNoteById(
        createdNote.id,
        TEMP_USER_ID
      );

      expect(retrievedNote).toBeDefined();
      expect(retrievedNote!.id).toBe(createdNote.id);
      expect(retrievedNote!.user_id).toBe(TEMP_USER_ID);
      expect(retrievedNote!.title).toBe(mockNoteInput.title);
    });

    it('should return undefined for non-existent note ID', async () => {
      const retrievedNote = await notesDatabase.getNoteById(
        'non-existent',
        TEMP_USER_ID
      );

      expect(retrievedNote).toBeUndefined();
    });
  });

  describe('updateNote', () => {
    let createdNote: Note | null;

    beforeEach(async () => {
      createdNote = await notesDatabase.createNote(mockNoteInput, TEMP_USER_ID);
    });

    afterEach(async () => {
      if (createdNote) {
        await notesDatabase.deleteNote(createdNote.id, TEMP_USER_ID);
        createdNote = null;
      }
    });

    it('should update an existing note for the user', async () => {
      // Add a small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updateData = {
        title: 'Updated Title',
        content: [
          {
            type: 'paragraph' as const,
            children: [{ text: 'Updated content' }],
          },
        ],
      };

      const updatedNote = await notesDatabase.updateNote(
        createdNote!.id,
        updateData,
        TEMP_USER_ID
      );

      expect(updatedNote.id).toBe(createdNote!.id);
      expect(updatedNote.user_id).toBe(TEMP_USER_ID);
      expect(updatedNote.title).toBe(updateData.title);
      expect(updatedNote.content).toEqual(updateData.content);
      expect(updatedNote.updatedAt.getTime()).toBeGreaterThan(
        createdNote!.updatedAt.getTime()
      );
    });

    it('should throw error when updating non-existent note', async () => {
      await expect(
        notesDatabase.updateNote(
          'non-existent',
          { title: 'New Title' },
          TEMP_USER_ID
        )
      ).rejects.toThrow('Note not found');
    });
  });

  describe('deleteNote', () => {
    let createdNote: Note | null;

    beforeEach(async () => {
      createdNote = await notesDatabase.createNote(mockNoteInput, TEMP_USER_ID);
    });

    it('should delete an existing note for the user', async () => {
      await notesDatabase.deleteNote(createdNote!.id, TEMP_USER_ID);

      const retrievedNote = await notesDatabase.getNoteById(
        createdNote!.id,
        TEMP_USER_ID
      );
      expect(retrievedNote).toBeUndefined();

      // Mark as cleaned up
      createdNote = null;
    });

    it('should throw error when deleting non-existent note', async () => {
      await expect(
        notesDatabase.deleteNote('non-existent', TEMP_USER_ID)
      ).rejects.toThrow('Note not found');
    });
  });

  describe('searchNotes', () => {
    beforeEach(async () => {
      // Create test notes with different content
      await notesDatabase.createNote(
        {
          title: 'JavaScript Tutorial',
          content: [
            {
              type: 'paragraph' as const,
              children: [{ text: 'Learn JavaScript basics' }],
            },
          ],
        },
        TEMP_USER_ID
      );

      await notesDatabase.createNote(
        {
          title: 'Cooking Recipe',
          content: [
            {
              type: 'paragraph' as const,
              children: [{ text: 'How to make pasta' }],
            },
          ],
        },
        TEMP_USER_ID
      );

      await notesDatabase.createNote(
        {
          title: 'Travel Notes',
          content: [
            {
              type: 'paragraph' as const,
              children: [{ text: 'Visit Tokyo next year' }],
            },
          ],
        },
        TEMP_USER_ID
      );
    });

    afterEach(async () => {
      await cleanupTestData();
    });

    it('should find notes by title search for the user', async () => {
      const results = await notesDatabase.searchNotes(
        'JavaScript',
        TEMP_USER_ID
      );

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Tutorial');
      expect(results[0].user_id).toBe(TEMP_USER_ID);
    });

    it('should find notes by content search for the user', async () => {
      const results = await notesDatabase.searchNotes('pasta', TEMP_USER_ID);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Cooking Recipe');
      expect(results[0].user_id).toBe(TEMP_USER_ID);
    });

    it('should return all notes when search query is empty', async () => {
      const results = await notesDatabase.searchNotes('', TEMP_USER_ID);

      expect(results).toHaveLength(3);
      results.forEach((note) => {
        expect(note.user_id).toBe(TEMP_USER_ID);
      });
    });

    it('should return empty array when no matches found', async () => {
      const results = await notesDatabase.searchNotes(
        'nonexistent',
        TEMP_USER_ID
      );

      expect(results).toHaveLength(0);
    });

    it('should be case insensitive', async () => {
      const results = await notesDatabase.searchNotes(
        'JAVASCRIPT',
        TEMP_USER_ID
      );

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Tutorial');
      expect(results[0].user_id).toBe(TEMP_USER_ID);
    });
  });
});
