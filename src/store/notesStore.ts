import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { Note } from '@/types';
import { notesDB } from '@/lib/database-adapter';
import type { CreateNoteInput, UpdateNoteInput } from '@/types';
import { useAuthStore } from '@/store/authStore';
import {
  useNotecardsStore,
  setNotesStoreUpdateCallback,
} from '@/store/notecardsStore';

// Create a simplified interface for the store
const notesDatabase = {
  getAllNotes: (userId: string) => notesDB.getAllNotes(userId),
  createNote: (title: string, content: unknown[], userId: string) =>
    notesDB.createNote({ title, content } as CreateNoteInput, userId),
  updateNote: (id: string, updates: UpdateNoteInput, userId: string) =>
    notesDB.updateNote(id, updates, userId),
  deleteNote: (id: string, userId: string) => notesDB.deleteNote(id, userId),
  searchNotes: (query: string, userId: string) =>
    notesDB.searchNotes(query, userId),
  getNoteById: (id: string, userId: string) => notesDB.getNoteById(id, userId),
};

interface NotesState {
  // State
  notes: Note[];
  currentNote: Note | null;
  searchQuery: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  loadNotes: () => Promise<void>;
  createNote: (title?: string, content?: unknown[]) => Promise<Note>;
  updateNote: (
    id: string,
    updates: Partial<Omit<Note, 'id' | 'createdAt' | 'user_id'>>
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  setSearchQuery: (query: string) => void;
  searchNotes: (query: string) => Promise<Note[]>;
  clearError: () => void;
  // Internal method to refresh specific notes from database
  refreshNotes: (noteIds: string[]) => Promise<void>;
}

export const useNotesStore = create<NotesState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      notes: [],
      currentNote: null,
      searchQuery: '',
      isLoading: false,
      isSaving: false,
      error: null,

      // Load all notes for the current user
      loadNotes: async () => {
        const authState = useAuthStore.getState();

        // Don't load if auth is not initialized yet
        if (!authState.isInitialized) {
          return;
        }

        // Clear any previous auth errors when auth state changes
        if (authState.user) {
          set({ error: null });
        }

        if (!authState.user) {
          set({ error: 'User not authenticated', isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const notes = await notesDatabase.getAllNotes(authState.user.id);
          set({ notes, isLoading: false });
        } catch (error) {
          console.error('Failed to load notes:', error);
          set({
            error:
              error instanceof Error ? error.message : 'Failed to load notes',
            isLoading: false,
          });
        }
      },

      // Create a new note
      createNote: async (
        title = 'Untitled',
        content = [{ type: 'paragraph', children: [{ text: '' }] }]
      ) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('User not authenticated');
        }

        set({ isSaving: true, error: null });
        try {
          const newNote = await notesDatabase.createNote(
            title,
            content,
            user.id
          );
          const { notes } = get();
          set({
            notes: [newNote, ...notes],
            currentNote: newNote,
            isSaving: false,
          });
          return newNote;
        } catch (error) {
          console.error('Failed to create note:', error);
          set({
            error:
              error instanceof Error ? error.message : 'Failed to create note',
            isSaving: false,
          });
          throw error;
        }
      },

      // Update an existing note
      updateNote: async (id, updates) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('User not authenticated');
        }

        set({ isSaving: true, error: null });
        try {
          const updatedNote = await notesDatabase.updateNote(
            id,
            updates,
            user.id
          );
          const { notes, currentNote } = get();

          const updatedNotes = notes.map((note) =>
            note.id === id ? updatedNote : note
          );

          // Sort by updatedAt to keep most recent first
          const sortedNotes = updatedNotes.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
          );

          set({
            notes: sortedNotes,
            currentNote: currentNote?.id === id ? updatedNote : currentNote,
            isSaving: false,
          });
        } catch (error) {
          console.error('Failed to update note:', error);
          set({
            error:
              error instanceof Error ? error.message : 'Failed to update note',
            isSaving: false,
          });
          throw error;
        }
      },

      // Delete a note
      deleteNote: async (id) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('User not authenticated');
        }

        set({ isLoading: true, error: null });
        try {
          await notesDatabase.deleteNote(id, user.id);
          const { notes, currentNote } = get();

          const filteredNotes = notes.filter((note) => note.id !== id);
          const newCurrentNote = currentNote?.id === id ? null : currentNote;

          set({
            notes: filteredNotes,
            currentNote: newCurrentNote,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to delete note:', error);
          set({
            error:
              error instanceof Error ? error.message : 'Failed to delete note',
            isLoading: false,
          });
          throw error;
        }
      },

      // Set the current active note
      setCurrentNote: (note) => set({ currentNote: note }),

      // Set search query
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Search notes
      searchNotes: async (query) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('User not authenticated');
        }

        try {
          const results = await notesDatabase.searchNotes(query, user.id);
          return results;
        } catch (error) {
          console.error('Failed to search notes:', error);
          throw error;
        }
      },

      // Clear error state
      clearError: () => set({ error: null }),

      // Refresh specific notes (used by notecard store for updates)
      refreshNotes: async (noteIds) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const { notes } = get();
        const updatedNotes = [...notes];

        for (const noteId of noteIds) {
          // Get fresh note from database
          const freshNote = await notesDatabase.getNoteById(noteId, user.id);
          if (freshNote) {
            // Update in the notes array
            const index = updatedNotes.findIndex((n) => n.id === noteId);
            if (index !== -1) {
              updatedNotes[index] = freshNote;
            }
          }
        }

        // Sort by updatedAt to keep most recent first
        const sortedNotes = updatedNotes.sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
        );

        set({ notes: sortedNotes });
      },
    })),
    { name: 'notes-store' }
  )
);

// Set up auth state subscription to automatically load notes when user becomes authenticated
useAuthStore.subscribe(
  (state) => ({
    user: state.user,
    session: state.session,
    isInitialized: state.isInitialized,
  }),
  (authState, prevAuthState) => {
    const notesStore = useNotesStore.getState();

    // Simple approach: if we have a user and no notes, load them
    if (authState.user && !notesStore.isLoading) {
      // Load notes if we don't have any yet
      if (notesStore.notes.length === 0) {
        notesStore.loadNotes();
      }

      // Also trigger notecards loading for fast view switching
      const notecardsStore = useNotecardsStore.getState();
      if (notecardsStore.notecards.length === 0 && !notecardsStore.isLoading) {
        notecardsStore.loadNotecards();
      }
    }

    // If user logged out, clear notes and errors
    if (prevAuthState.user && !authState.user) {
      useNotesStore.setState({
        notes: [],
        currentNote: null,
        error: null,
      });
    }
  }
);

// Set up callback for notecards store
setNotesStoreUpdateCallback((affectedNoteIds: string[]) => {
  const store = useNotesStore.getState();
  store.refreshNotes(affectedNoteIds);
});

// Selectors for easier consumption
export const useCurrentNote = () => useNotesStore((state) => state.currentNote);
export const useNotes = () => useNotesStore((state) => state.notes);
export const useCurrentNoteTitle = () =>
  useNotesStore((state) => state.currentNote?.title);
export const useIsLoading = () => useNotesStore((state) => state.isLoading);
export const useIsSaving = () => useNotesStore((state) => state.isSaving);
export const useNotesError = () => useNotesStore((state) => state.error);

// Filtered notes selector for backward compatibility
export const useFilteredNotes = () => {
  const notes = useNotesStore((state) => state.notes);
  const searchQuery = useNotesStore((state) => state.searchQuery);

  if (!searchQuery.trim()) {
    return notes;
  }

  const query = searchQuery.toLowerCase();
  return notes.filter((note) => {
    const titleMatch = note.title.toLowerCase().includes(query);
    const contentMatch = JSON.stringify(note.content)
      .toLowerCase()
      .includes(query);
    return titleMatch || contentMatch;
  });
};
