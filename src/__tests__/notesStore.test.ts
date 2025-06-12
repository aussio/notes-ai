import { renderHook, act } from '@testing-library/react';
import {
  useNotesStore,
  useFilteredNotes,
  useCurrentNoteTitle,
  useIsSaving,
} from '@/store/notesStore';
import type { Note, CustomElement } from '@/types';
import { TEMP_USER_ID } from '@/types';
import { notesDatabase } from '@/lib/database';

// Helper to create mock notes
const createMockNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'test-id',
  user_id: TEMP_USER_ID,
  title: 'Test Note',
  content: [
    { type: 'paragraph', children: [{ text: 'Test content' }] },
  ] as CustomElement[],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('NotesStore Integration', () => {
  beforeEach(async () => {
    // Reset the store state
    useNotesStore.setState({
      notes: [],
      currentNote: null,
      searchQuery: '',
      isLoading: false,
      isSaving: false,
      error: null,
    });

    // Clean up database before each test
    const allNotes = await notesDatabase.getAllNotes(TEMP_USER_ID);
    for (const note of allNotes) {
      await notesDatabase.deleteNote(note.id, TEMP_USER_ID);
    }
  });

  afterAll(async () => {
    // Final cleanup
    const allNotes = await notesDatabase.getAllNotes(TEMP_USER_ID);
    for (const note of allNotes) {
      await notesDatabase.deleteNote(note.id, TEMP_USER_ID);
    }
  });

  describe('loadNotes', () => {
    it('should load notes from database and update state', async () => {
      // Create some notes in the database first
      await notesDatabase.createNote(
        {
          title: 'Note 1',
          content: [
            { type: 'paragraph' as const, children: [{ text: 'Content 1' }] },
          ],
        },
        TEMP_USER_ID
      );

      await notesDatabase.createNote(
        {
          title: 'Note 2',
          content: [
            { type: 'paragraph' as const, children: [{ text: 'Content 2' }] },
          ],
        },
        TEMP_USER_ID
      );

      const { loadNotes } = useNotesStore.getState();
      await loadNotes();

      const state = useNotesStore.getState();
      expect(state.notes).toHaveLength(2);
      expect(state.notes.map((n) => n.title)).toEqual(
        expect.arrayContaining(['Note 1', 'Note 2'])
      );
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle empty database', async () => {
      const { loadNotes } = useNotesStore.getState();
      await loadNotes();

      const state = useNotesStore.getState();
      expect(state.notes).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('createNote', () => {
    it('should create a new note and update state', async () => {
      const { createNote } = useNotesStore.getState();
      const result = await createNote('Test Title');

      expect(result.title).toBe('Test Title');
      expect(result.user_id).toBe(TEMP_USER_ID);
      expect(result.id).toBeDefined();

      const state = useNotesStore.getState();
      expect(state.notes).toContain(result);
      expect(state.currentNote).toBe(result);
      expect(state.isSaving).toBe(false);
    });
  });

  describe('updateNote', () => {
    it('should update an existing note', async () => {
      // Create a note first
      const { createNote, updateNote } = useNotesStore.getState();
      const originalNote = await createNote('Original Title');

      // Add a small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      await updateNote(originalNote.id, { title: 'Updated Title' });

      const state = useNotesStore.getState();
      const updatedNote = state.notes.find((n) => n.id === originalNote.id);
      expect(updatedNote?.title).toBe('Updated Title');
      expect(state.currentNote?.title).toBe('Updated Title');
      expect(state.isSaving).toBe(false);
    });
  });

  describe('deleteNote', () => {
    it('should delete a note and update state', async () => {
      // Create two notes first
      const { createNote, deleteNote } = useNotesStore.getState();
      const note1 = await createNote('Note 1');
      const note2 = await createNote('Note 2');

      await deleteNote(note1.id);

      const state = useNotesStore.getState();
      expect(state.notes).toHaveLength(1);
      expect(state.notes[0].id).toBe(note2.id);
      expect(state.currentNote?.id).toBe(note2.id); // Current switches to remaining note
    });
  });

  describe('searchNotes', () => {
    it('should search notes by title', async () => {
      // Create some notes with different titles
      const { createNote, searchNotes } = useNotesStore.getState();
      await createNote('JavaScript Tutorial');
      await createNote('Python Guide');
      await createNote('TypeScript Notes');

      const results = await searchNotes('script');

      expect(results).toHaveLength(2);
      expect(results.map((n) => n.title)).toEqual(
        expect.arrayContaining(['JavaScript Tutorial', 'TypeScript Notes'])
      );
    });

    it('should return all notes for empty query', async () => {
      const { createNote, searchNotes } = useNotesStore.getState();
      await createNote('Note 1');
      await createNote('Note 2');

      const results = await searchNotes('');

      expect(results).toHaveLength(2);
    });
  });
});

describe('Selectors', () => {
  beforeEach(() => {
    useNotesStore.setState({
      notes: [],
      currentNote: null,
      searchQuery: '',
      isLoading: false,
      isSaving: false,
      error: null,
    });
  });

  describe('useFilteredNotes', () => {
    it('returns all notes when no search query', () => {
      const notes = [
        createMockNote({ id: '1', title: 'First Note' }),
        createMockNote({ id: '2', title: 'Second Note' }),
      ];

      act(() => {
        useNotesStore.setState({ notes, searchQuery: '' });
      });

      const { result } = renderHook(() => useFilteredNotes());
      expect(result.current).toEqual(notes);
    });

    it('filters notes by title', () => {
      const notes = [
        createMockNote({ id: '1', title: 'JavaScript Tutorial' }),
        createMockNote({ id: '2', title: 'Python Guide' }),
        createMockNote({ id: '3', title: 'TypeScript Notes' }),
      ];

      act(() => {
        useNotesStore.setState({ notes, searchQuery: 'script' });
      });

      const { result } = renderHook(() => useFilteredNotes());
      expect(result.current).toHaveLength(2);
      expect(result.current.map((n) => n.title)).toEqual([
        'JavaScript Tutorial',
        'TypeScript Notes',
      ]);
    });

    it('filters notes by content', () => {
      const notes = [
        createMockNote({
          id: '1',
          title: 'Note 1',
          content: [
            {
              type: 'paragraph',
              children: [{ text: 'React hooks are great' }],
            },
          ],
        }),
        createMockNote({
          id: '2',
          title: 'Note 2',
          content: [
            { type: 'paragraph', children: [{ text: 'Vue composition API' }] },
          ],
        }),
      ];

      act(() => {
        useNotesStore.setState({ notes, searchQuery: 'hooks' });
      });

      const { result } = renderHook(() => useFilteredNotes());
      expect(result.current).toHaveLength(1);
      expect(result.current[0].title).toBe('Note 1');
    });

    it('sorts notes by updatedAt in descending order', () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const notes = [
        createMockNote({
          id: '1',
          title: 'Oldest Note',
          updatedAt: dayAgo,
        }),
        createMockNote({
          id: '2',
          title: 'Newest Note',
          updatedAt: now,
        }),
        createMockNote({
          id: '3',
          title: 'Middle Note',
          updatedAt: hourAgo,
        }),
      ];

      act(() => {
        useNotesStore.setState({ notes, searchQuery: '' });
      });

      const { result } = renderHook(() => useFilteredNotes());

      // Should be sorted by updatedAt descending (newest first)
      expect(result.current).toHaveLength(3);
      expect(result.current[0].title).toBe('Newest Note');
      expect(result.current[1].title).toBe('Middle Note');
      expect(result.current[2].title).toBe('Oldest Note');
    });

    it('sorts filtered search results by updatedAt in descending order', () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const notes = [
        createMockNote({
          id: '1',
          title: 'JavaScript Tutorial',
          updatedAt: hourAgo,
        }),
        createMockNote({
          id: '2',
          title: 'TypeScript Guide',
          updatedAt: now,
        }),
        createMockNote({
          id: '3',
          title: 'Python Notes',
          updatedAt: now,
        }),
      ];

      act(() => {
        useNotesStore.setState({ notes, searchQuery: 'script' });
      });

      const { result } = renderHook(() => useFilteredNotes());

      // Should filter to only notes containing "script" and sort by updatedAt descending
      expect(result.current).toHaveLength(2);
      expect(result.current[0].title).toBe('TypeScript Guide');
      expect(result.current[1].title).toBe('JavaScript Tutorial');
    });
  });

  describe('useCurrentNoteTitle', () => {
    it('returns current note title', () => {
      const note = createMockNote({ title: 'Current Note' });

      act(() => {
        useNotesStore.setState({ currentNote: note });
      });

      const { result } = renderHook(() => useCurrentNoteTitle());
      expect(result.current).toBe('Current Note');
    });

    it('returns default title when no current note', () => {
      const { result } = renderHook(() => useCurrentNoteTitle());
      expect(result.current).toBe('Untitled Note');
    });
  });

  describe('useIsSaving', () => {
    it('returns saving state', () => {
      act(() => {
        useNotesStore.setState({ isSaving: true });
      });

      const { result } = renderHook(() => useIsSaving());
      expect(result.current).toBe(true);
    });

    it('returns false by default', () => {
      const { result } = renderHook(() => useIsSaving());
      expect(result.current).toBe(false);
    });
  });
});
