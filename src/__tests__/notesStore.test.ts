import { renderHook, act } from '@testing-library/react';
import {
  useNotesStore,
  useFilteredNotes,
  useCurrentNoteTitle,
  useIsSaving,
} from '@/store/notesStore';
import type { Note } from '@/types';

// Helper to create mock notes
const createMockNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'test-id',
  title: 'Test Note',
  content: [{ type: 'paragraph', children: [{ text: 'Test content' }] }],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('NotesStore - Real Database Integration', () => {
  beforeEach(async () => {
    // Reset store state before each test
    useNotesStore.setState({
      notes: [],
      currentNote: null,
      searchQuery: '',
      isLoading: false,
      isSaving: false,
      error: null,
    });

    // Clear the database before each test
    const { notesDatabase } = await import('@/lib/database');
    const allNotes = await notesDatabase.getAllNotes();
    for (const note of allNotes) {
      await notesDatabase.deleteNote(note.id);
    }
  });

  describe('loadNotes', () => {
    it('loads notes from database successfully', async () => {
      // Create some notes in the database first
      const { notesDatabase } = await import('@/lib/database');
      await notesDatabase.createNote({
        title: 'Note 1',
        content: [{ type: 'paragraph', children: [{ text: 'Content 1' }] }],
      });
      await notesDatabase.createNote({
        title: 'Note 2',
        content: [{ type: 'paragraph', children: [{ text: 'Content 2' }] }],
      });

      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        await result.current.loadNotes();
      });

      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes.map((n) => n.title)).toEqual(
        expect.arrayContaining(['Note 1', 'Note 2'])
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('loads empty notes list when database is empty', async () => {
      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        await result.current.loadNotes();
      });

      expect(result.current.notes).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('createNote', () => {
    it('creates note successfully', async () => {
      const { result } = renderHook(() => useNotesStore());

      let createdNote: Note;
      await act(async () => {
        createdNote = await result.current.createNote('New Note');
      });

      expect(createdNote!.title).toBe('New Note');
      expect(createdNote!.id).toBeDefined();
      expect(result.current.notes).toContain(createdNote!);
      expect(result.current.currentNote).toEqual(createdNote!);
      expect(result.current.isSaving).toBe(false);
    });

    it('uses default title and content when not provided', async () => {
      const { result } = renderHook(() => useNotesStore());

      let createdNote: Note;
      await act(async () => {
        createdNote = await result.current.createNote();
      });

      expect(createdNote!.title).toBe('Untitled Note');
      expect(createdNote!.content).toEqual([
        { type: 'paragraph', children: [{ text: '' }] },
      ]);
    });

    it('creates note with custom content', async () => {
      const { result } = renderHook(() => useNotesStore());
      const customContent = [
        { type: 'paragraph', children: [{ text: 'Custom content' }] },
      ];

      let createdNote: Note;
      await act(async () => {
        createdNote = await result.current.createNote(
          'Custom Note',
          customContent
        );
      });

      expect(createdNote!.title).toBe('Custom Note');
      expect(createdNote!.content).toEqual(customContent);
    });
  });

  describe('updateNote', () => {
    it('updates note successfully', async () => {
      // Create a note first
      const { result } = renderHook(() => useNotesStore());

      let originalNote: Note;
      await act(async () => {
        originalNote = await result.current.createNote('Original Title');
      });

      // Update the note
      await act(async () => {
        await result.current.updateNote(originalNote!.id, {
          title: 'Updated Title',
        });
      });

      const updatedNote = result.current.notes.find(
        (n) => n.id === originalNote!.id
      );
      expect(updatedNote?.title).toBe('Updated Title');
      expect(result.current.currentNote?.title).toBe('Updated Title');
      expect(result.current.isSaving).toBe(false);
    });

    it('throws error when updating non-existent note', async () => {
      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        try {
          await result.current.updateNote('non-existent-id', {
            title: 'Updated',
          });
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to update note');
      expect(result.current.isSaving).toBe(false);
    });
  });

  describe('deleteNote', () => {
    it('deletes note successfully', async () => {
      // Create two notes first
      const { result } = renderHook(() => useNotesStore());

      let note1: Note, note2: Note;
      await act(async () => {
        note1 = await result.current.createNote('Note 1');
        note2 = await result.current.createNote('Note 2');
      });

      // Delete the first note
      await act(async () => {
        await result.current.deleteNote(note1!.id);
      });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].id).toBe(note2!.id);
      expect(result.current.currentNote?.id).toBe(note2!.id); // Current switches to remaining note
      expect(result.current.isLoading).toBe(false);
    });

    it('handles deleting the only note (sets current to null)', async () => {
      const { result } = renderHook(() => useNotesStore());

      let note: Note;
      await act(async () => {
        note = await result.current.createNote('Only Note');
      });

      expect(result.current.currentNote).toEqual(note!);

      await act(async () => {
        await result.current.deleteNote(note!.id);
      });

      expect(result.current.currentNote).toBeNull();
      expect(result.current.notes).toHaveLength(0);
    });

    it('throws error when deleting non-existent note', async () => {
      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        try {
          await result.current.deleteNote('non-existent-id');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to delete note');
    });
  });

  describe('state management', () => {
    it('sets current note', () => {
      const note = createMockNote({ title: 'Test Note' });
      const { result } = renderHook(() => useNotesStore());

      act(() => {
        result.current.setCurrentNote(note);
      });

      expect(result.current.currentNote).toEqual(note);
    });

    it('sets search query', () => {
      const { result } = renderHook(() => useNotesStore());

      act(() => {
        result.current.setSearchQuery('test search');
      });

      expect(result.current.searchQuery).toBe('test search');
    });

    it('clears error', () => {
      const { result } = renderHook(() => useNotesStore());

      // Set error first
      act(() => {
        useNotesStore.setState({ error: 'Test error' });
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('searchNotes', () => {
    it('searches notes by title', async () => {
      // Create some notes with different titles
      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        await result.current.createNote('JavaScript Tutorial');
        await result.current.createNote('Python Guide');
        await result.current.createNote('TypeScript Notes');
      });

      let searchResults: Note[];
      await act(async () => {
        searchResults = await result.current.searchNotes('script');
      });

      expect(searchResults!).toHaveLength(2);
      expect(searchResults!.map((n) => n.title)).toEqual(
        expect.arrayContaining(['JavaScript Tutorial', 'TypeScript Notes'])
      );
    });

    it('returns all notes for empty query', async () => {
      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        await result.current.createNote('Note 1');
        await result.current.createNote('Note 2');
      });

      let searchResults: Note[];
      await act(async () => {
        searchResults = await result.current.searchNotes('  ');
      });

      expect(searchResults!).toHaveLength(2);
    });

    it('returns empty array when no matches found', async () => {
      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        await result.current.createNote('JavaScript Tutorial');
      });

      let searchResults: Note[];
      await act(async () => {
        searchResults = await result.current.searchNotes('nonexistent');
      });

      expect(searchResults!).toHaveLength(0);
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
