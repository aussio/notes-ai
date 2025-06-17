import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { Note, CustomElement } from '@/types';
import { notesDatabase } from '@/lib/database';
import { useAuthStore } from '@/store/authStore';
import {
  useNotecardsStore,
  setNotesStoreUpdateCallback,
} from '@/store/notecardsStore';
import { syncService } from '@/lib/sync/SyncService';

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
  createNote: (title?: string, content?: CustomElement[]) => Promise<Note>;
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

// Debounce map for per-note debouncing
const noteSyncDebounceMap = new Map<string, NodeJS.Timeout>();

// Helper function to deduplicate notes by ID
const deduplicateNotes = (notes: Note[]): Note[] => {
  const noteMap = new Map<string, Note>();
  notes.forEach((note) => {
    noteMap.set(note.id, note);
  });
  return Array.from(noteMap.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
};

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
          const freshNotes = await notesDatabase.getAllNotes(authState.user.id);
          const { notes: currentNotes } = get();

          // Smart merge: preserve local notes that might have unsaved changes
          const freshNotesMap = new Map(
            freshNotes.map((note) => [note.id, note])
          );
          const mergedNotes: Note[] = [];

          // First, add all current notes, preferring local version for potential unsaved changes
          currentNotes.forEach((localNote) => {
            const freshNote = freshNotesMap.get(localNote.id);
            if (freshNote) {
              // If fresh note is newer, use it (database is authoritative)
              // If local note is newer or same, keep local (might have unsaved changes)
              const useLocal = localNote.updatedAt >= freshNote.updatedAt;
              mergedNotes.push(useLocal ? localNote : freshNote);
              freshNotesMap.delete(localNote.id); // Mark as processed
            } else {
              // Local note doesn't exist in database yet (new/unsaved)
              mergedNotes.push(localNote);
            }
          });

          // Add any remaining fresh notes that weren't in local store
          freshNotesMap.forEach((freshNote) => {
            mergedNotes.push(freshNote);
          });

          // Sort by updatedAt to keep most recent first
          const sortedNotes = mergedNotes.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
          );

          set({ notes: sortedNotes, isLoading: false });
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
        content = [
          { type: 'paragraph', children: [{ text: '' }] },
        ] as CustomElement[]
      ) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('User not authenticated');
        }

        set({ isSaving: true, error: null });
        try {
          const newNote = await notesDatabase.createNote(
            { title, content },
            user.id
          );
          const { notes } = get();

          // Ensure we don't add duplicates
          const existingIndex = notes.findIndex(
            (note) => note.id === newNote.id
          );
          const updatedNotes =
            existingIndex >= 0
              ? notes.map((note) => (note.id === newNote.id ? newNote : note))
              : [newNote, ...notes];

          set({
            notes: updatedNotes,
            currentNote: newNote,
            isSaving: false,
          });

          // Queue for background sync
          await syncService.queueOperation({
            type: 'CREATE',
            table: 'notes',
            data: newNote,
            userId: user.id,
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

          // Debounce cloud sync per note
          if (noteSyncDebounceMap.has(id)) {
            clearTimeout(noteSyncDebounceMap.get(id));
          }
          noteSyncDebounceMap.set(
            id,
            setTimeout(() => {
              syncService.queueOperation({
                type: 'UPDATE',
                table: 'notes',
                data: updatedNote,
                userId: user.id,
              });
              noteSyncDebounceMap.delete(id);
            }, 500)
          );
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
          // Get the note before deleting for sync queue
          const noteToDelete = await notesDatabase.getNoteById(id, user.id);

          await notesDatabase.deleteNote(id, user.id);
          const { notes, currentNote } = get();

          const filteredNotes = notes.filter((note) => note.id !== id);
          const newCurrentNote = currentNote?.id === id ? null : currentNote;

          set({
            notes: filteredNotes,
            currentNote: newCurrentNote,
            isLoading: false,
          });

          // Queue for background sync if note existed
          if (noteToDelete) {
            await syncService.queueOperation({
              type: 'DELETE',
              table: 'notes',
              data: noteToDelete,
              userId: user.id,
            });
          }
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
        const freshNotes: Note[] = [];

        for (const noteId of noteIds) {
          // Get fresh note from database
          const freshNote = await notesDatabase.getNoteById(noteId, user.id);
          if (freshNote) {
            freshNotes.push(freshNote);
          }
        }

        // Merge with existing notes and deduplicate
        const mergedNotes = [...notes, ...freshNotes];
        const deduplicatedNotes = deduplicateNotes(mergedNotes);

        set({ notes: deduplicatedNotes });
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
  async (authState, prevAuthState) => {
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

      // Trigger initial sync when user becomes authenticated
      if (!prevAuthState.user && authState.user) {
        try {
          await syncService.syncFromCloud(authState.user.id);
          // Reload local data after sync
          notesStore.loadNotes();
          notecardsStore.loadNotecards();
        } catch (error) {
          console.error('Initial sync failed:', error);
          // Don't throw - app should still work offline
        }
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
