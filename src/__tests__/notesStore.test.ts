import { renderHook, act } from '@testing-library/react';
import {
  useNotesStore,
  useFilteredNotes,
  useCurrentNoteTitle,
  useIsSaving,
} from '@/store/notesStore';
import type { Note, CustomElement } from '@/types';

// Test user ID constant
const TEST_USER_ID = 'test-user-001';

// Mock only the database adapter with simplified mock functions
jest.mock('@/lib/database-adapter', () => ({
  notesDB: {
    getAllNotes: jest.fn().mockResolvedValue([]),
    createNote: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
    searchNotes: jest.fn().mockResolvedValue([]),
    getNoteById: jest.fn(),
  },
}));

// Mock the auth store since we need authentication for the store
jest.mock('@/store/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      user: { id: TEST_USER_ID },
      isInitialized: true,
    }),
    subscribe: jest.fn(),
  },
}));

// Mock notecardsStore with minimal functionality
jest.mock('@/store/notecardsStore', () => ({
  useNotecardsStore: {
    getState: () => ({
      notecards: [],
      isLoading: false,
      loadNotecards: jest.fn(),
    }),
  },
  setNotesStoreUpdateCallback: jest.fn(),
}));

// Helper to create mock notes
const createMockNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'test-id',
  user_id: TEST_USER_ID,
  title: 'Test Note',
  content: [
    { type: 'paragraph', children: [{ text: 'Test content' }] },
  ] as CustomElement[],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
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

    it('returns notes in the order they are stored', () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const notes = [
        createMockNote({
          id: '1',
          title: 'First Note',
          updatedAt: dayAgo,
        }),
        createMockNote({
          id: '2',
          title: 'Second Note',
          updatedAt: now,
        }),
        createMockNote({
          id: '3',
          title: 'Third Note',
          updatedAt: hourAgo,
        }),
      ];

      act(() => {
        useNotesStore.setState({ notes, searchQuery: '' });
      });

      const { result } = renderHook(() => useFilteredNotes());

      // Should return notes in the same order as stored (not sorted by the selector)
      expect(result.current).toHaveLength(3);
      expect(result.current[0].title).toBe('First Note');
      expect(result.current[1].title).toBe('Second Note');
      expect(result.current[2].title).toBe('Third Note');
    });

    it('filters search results maintain original order', () => {
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

      // Should filter and maintain store order
      expect(result.current).toHaveLength(2);
      expect(result.current[0].title).toBe('JavaScript Tutorial');
      expect(result.current[1].title).toBe('TypeScript Guide');
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

    it('returns undefined when no current note', () => {
      const { result } = renderHook(() => useCurrentNoteTitle());
      expect(result.current).toBeUndefined();
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

describe('Notes Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNotesStore.setState({
      notes: [],
      currentNote: null,
      searchQuery: '',
      isLoading: false,
      isSaving: false,
      error: null,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createNote', () => {
    it('should create a new note and add it to the store', async () => {
      const { notesDB } = await import('@/lib/database-adapter');
      const mockNote = createMockNote({
        id: 'new-note-id',
        title: 'Test Note Title',
        user_id: TEST_USER_ID,
      });

      (notesDB.createNote as jest.Mock).mockResolvedValue(mockNote);

      const { result } = renderHook(() => useNotesStore());

      expect(result.current.notes).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);

      // Start creating note
      await act(async () => {
        await result.current.createNote('Test Note Title');
      });

      // Should have created the note
      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('Test Note Title');
      expect(result.current.notes[0].user_id).toBe(TEST_USER_ID);
      expect(result.current.currentNote).toEqual(mockNote);
      expect(result.current.isSaving).toBe(false);
    });

    it('should handle create note errors', async () => {
      const { result } = renderHook(() => useNotesStore());

      // Test error handling by trying to create note when not authenticated
      // Mock auth store to return no user
      const { useAuthStore } = await import('@/store/authStore');
      const originalGetState = useAuthStore.getState;
      useAuthStore.getState = jest
        .fn()
        .mockReturnValue({ user: null, isInitialized: true });

      try {
        await act(async () => {
          await result.current.createNote('Test Note');
        });
      } catch {
        // Expected to throw an error
      }

      // Should handle the error gracefully
      expect(result.current.isSaving).toBe(false);
      expect(result.current.notes).toHaveLength(0);

      // Restore original auth store
      useAuthStore.getState = originalGetState;
    });
  });

  describe('loadNotes', () => {
    it('should load notes from the database', async () => {
      const { notesDB } = await import('@/lib/database-adapter');
      const mockNotes = [
        createMockNote({ id: '1', title: 'Note 1' }),
        createMockNote({ id: '2', title: 'Note 2' }),
      ];

      (notesDB.getAllNotes as jest.Mock).mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useNotesStore());

      expect(result.current.notes).toHaveLength(0);

      // Load notes
      await act(async () => {
        await result.current.loadNotes();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.notes).toEqual(mockNotes);
      expect(notesDB.getAllNotes).toHaveBeenCalledWith(TEST_USER_ID);
    });
  });

  describe('setCurrentNote', () => {
    it('should set the current note', () => {
      const { result } = renderHook(() => useNotesStore());

      expect(result.current.currentNote).toBeNull();

      const mockNote = {
        id: 'test-note-1',
        user_id: TEST_USER_ID,
        title: 'Test Note',
        content: [{ type: 'paragraph' as const, children: [{ text: 'Test' }] }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.setCurrentNote(mockNote);
      });

      expect(result.current.currentNote).toEqual(mockNote);
    });

    it('should clear current note when called with null', () => {
      const { result } = renderHook(() => useNotesStore());

      const mockNote = {
        id: 'test-note-1',
        user_id: TEST_USER_ID,
        title: 'Test Note',
        content: [{ type: 'paragraph' as const, children: [{ text: 'Test' }] }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set a note first
      act(() => {
        result.current.setCurrentNote(mockNote);
      });

      expect(result.current.currentNote).toEqual(mockNote);

      // Clear it
      act(() => {
        result.current.setCurrentNote(null);
      });

      expect(result.current.currentNote).toBeNull();
    });
  });

  describe('setSearchQuery', () => {
    it('should update the search query', () => {
      const { result } = renderHook(() => useNotesStore());

      expect(result.current.searchQuery).toBe('');

      act(() => {
        result.current.setSearchQuery('test query');
      });

      expect(result.current.searchQuery).toBe('test query');
    });
  });
});
