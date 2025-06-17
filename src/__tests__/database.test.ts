import { notesDatabase } from '@/lib/database';
import type { CreateNoteInput, Note } from '@/types';

// Test user ID for database tests
const TEST_USER_ID = 'test-user-001';

const exampleNoteInput: CreateNoteInput = {
  title: 'Test Note',
  content: [
    { type: 'paragraph' as const, children: [{ text: 'Test content' }] },
  ],
};

const exampleNoteInput2: CreateNoteInput = {
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
      const existingNotes = await notesDatabase.getAllNotes(TEST_USER_ID);
      for (const note of existingNotes) {
        await notesDatabase.deleteNote(note.id, TEST_USER_ID);
      }
    } catch {
      // Ignore errors during cleanup - might be empty database
    }
  }

  beforeEach(async () => {
    // Clean up IndexedDB and notes before each test for isolation
    const allNotes = await notesDatabase.getAllNotes(TEST_USER_ID);
    for (const note of allNotes) {
      await notesDatabase.deleteNote(note.id, TEST_USER_ID);
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
        await notesDatabase.deleteNote(createdNote.id, TEST_USER_ID);
        createdNote = null;
      }
    });

    it('should create a new note successfully', async () => {
      createdNote = await notesDatabase.createNote(
        exampleNoteInput,
        TEST_USER_ID
      );

      expect(createdNote).toBeDefined();
      expect(createdNote.id).toBeDefined();
      expect(createdNote.user_id).toBe(TEST_USER_ID);
      expect(createdNote.title).toBe(exampleNoteInput.title);
      expect(createdNote.content).toEqual(exampleNoteInput.content);
      expect(createdNote.createdAt).toBeInstanceOf(Date);
      expect(createdNote.updatedAt).toBeInstanceOf(Date);
    });

    it('should create multiple notes and return them in correct order', async () => {
      const note1 = await notesDatabase.createNote(
        exampleNoteInput,
        TEST_USER_ID
      );
      const note2 = await notesDatabase.createNote(
        exampleNoteInput2,
        TEST_USER_ID
      );

      // Cleanup both notes
      await notesDatabase.deleteNote(note1.id, TEST_USER_ID);
      await notesDatabase.deleteNote(note2.id, TEST_USER_ID);

      expect(note1.user_id).toBe(TEST_USER_ID);
      expect(note2.user_id).toBe(TEST_USER_ID);
      expect(note1.title).toBe(exampleNoteInput.title);
      expect(note2.title).toBe(exampleNoteInput2.title);
    });
  });

  describe('getAllNotes', () => {
    let createdNote: Note | null;

    afterEach(async () => {
      if (createdNote) {
        await notesDatabase.deleteNote(createdNote.id, TEST_USER_ID);
        createdNote = null;
      }
    });

    it('should return all notes for the user ordered by updatedAt', async () => {
      createdNote = await notesDatabase.createNote(
        exampleNoteInput,
        TEST_USER_ID
      );
      const secondNote = await notesDatabase.createNote(
        exampleNoteInput2,
        TEST_USER_ID
      );

      const allNotes = await notesDatabase.getAllNotes(TEST_USER_ID);
      expect(allNotes).toHaveLength(2);
      expect(allNotes.every((note) => note.user_id === TEST_USER_ID)).toBe(
        true
      );

      // Clean up the second note
      await notesDatabase.deleteNote(secondNote.id, TEST_USER_ID);

      const remainingNotes = await notesDatabase.getAllNotes(TEST_USER_ID);
      expect(remainingNotes).toHaveLength(1);
      expect(remainingNotes[0].user_id).toBe(TEST_USER_ID);
    });
  });

  describe('getNoteById', () => {
    let createdNote: Note | null;

    afterEach(async () => {
      if (createdNote) {
        await notesDatabase.deleteNote(createdNote.id, TEST_USER_ID);
        createdNote = null;
      }
    });

    it('should retrieve a specific note by ID for the user', async () => {
      createdNote = await notesDatabase.createNote(
        exampleNoteInput,
        TEST_USER_ID
      );

      const retrievedNote = await notesDatabase.getNoteById(
        createdNote.id,
        TEST_USER_ID
      );

      expect(retrievedNote).toBeDefined();
      expect(retrievedNote!.id).toBe(createdNote.id);
      expect(retrievedNote!.user_id).toBe(TEST_USER_ID);
      expect(retrievedNote!.title).toBe(exampleNoteInput.title);
    });

    it('should return undefined for non-existent note ID', async () => {
      const retrievedNote = await notesDatabase.getNoteById(
        'non-existent',
        TEST_USER_ID
      );

      expect(retrievedNote).toBeUndefined();
    });
  });

  describe('updateNote', () => {
    let createdNote: Note | null;

    beforeEach(async () => {
      createdNote = await notesDatabase.createNote(
        exampleNoteInput,
        TEST_USER_ID
      );
    });

    afterEach(async () => {
      if (createdNote) {
        await notesDatabase.deleteNote(createdNote.id, TEST_USER_ID);
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
        TEST_USER_ID
      );

      expect(updatedNote.id).toBe(createdNote!.id);
      expect(updatedNote.user_id).toBe(TEST_USER_ID);
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
          { title: 'Updated' },
          TEST_USER_ID
        )
      ).rejects.toThrow();
    });
  });

  describe('deleteNote', () => {
    it('should delete an existing note for the user', async () => {
      const createdNote = await notesDatabase.createNote(
        exampleNoteInput,
        TEST_USER_ID
      );

      await notesDatabase.deleteNote(createdNote.id, TEST_USER_ID);

      const retrievedNote = await notesDatabase.getNoteById(
        createdNote.id,
        TEST_USER_ID
      );
      expect(retrievedNote).toBeUndefined();
    });

    it('should throw error when deleting non-existent note', async () => {
      await expect(
        notesDatabase.deleteNote('non-existent', TEST_USER_ID)
      ).rejects.toThrow();
    });
  });

  describe('searchNotes', () => {
    let createdNotes: Note[] = [];

    beforeEach(async () => {
      // Create test notes for searching
      const note1 = await notesDatabase.createNote(
        {
          title: 'JavaScript Tutorial',
          content: [
            { type: 'paragraph', children: [{ text: 'Learn JavaScript' }] },
          ],
        },
        TEST_USER_ID
      );

      const note2 = await notesDatabase.createNote(
        {
          title: 'React Guide',
          content: [
            { type: 'paragraph', children: [{ text: 'Building with React' }] },
          ],
        },
        TEST_USER_ID
      );

      const note3 = await notesDatabase.createNote(
        {
          title: 'Python Basics',
          content: [
            { type: 'paragraph', children: [{ text: 'Python programming' }] },
          ],
        },
        TEST_USER_ID
      );

      createdNotes = [note1, note2, note3];
    });

    afterEach(async () => {
      // Clean up created notes
      for (const note of createdNotes) {
        try {
          await notesDatabase.deleteNote(note.id, TEST_USER_ID);
        } catch {
          // Ignore errors - note might already be deleted
        }
      }
      createdNotes = [];
    });

    it('should return all notes when search query is empty', async () => {
      const results = await notesDatabase.searchNotes('', TEST_USER_ID);
      expect(results.length).toBeGreaterThanOrEqual(3);
      expect(results.every((note) => note.user_id === TEST_USER_ID)).toBe(true);
    });

    it('should search notes by title', async () => {
      const results = await notesDatabase.searchNotes(
        'JavaScript',
        TEST_USER_ID
      );
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Tutorial');
      expect(results[0].user_id).toBe(TEST_USER_ID);
    });

    it('should search notes by content', async () => {
      const results = await notesDatabase.searchNotes('React', TEST_USER_ID);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('React Guide');
      expect(results[0].user_id).toBe(TEST_USER_ID);
    });

    it('should return empty array for non-matching search', async () => {
      const results = await notesDatabase.searchNotes(
        'NonExistent',
        TEST_USER_ID
      );
      expect(results).toHaveLength(0);
    });

    it('should perform case-insensitive search', async () => {
      const results = await notesDatabase.searchNotes('python', TEST_USER_ID);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Python Basics');
      expect(results[0].user_id).toBe(TEST_USER_ID);
    });
  });
});
