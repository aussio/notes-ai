import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { Notecard } from '@/types';
import { notecardsDatabase, notesDatabase } from '@/lib/database';
import {
  removeNotecardEmbedsFromContent,
  findNotesWithNotecardEmbeds,
} from '@/lib/editor';

import { useAuthStore } from '@/store/authStore';
import { syncService } from '@/lib/sync/SyncService';

// Callback to notify notes store when notes are updated due to notecard changes
let notifyNotesStoreUpdate: ((affectedNoteIds: string[]) => void) | null = null;

export const setNotesStoreUpdateCallback = (
  callback: (affectedNoteIds: string[]) => void
) => {
  notifyNotesStoreUpdate = callback;
};

interface NotecardsState {
  // State
  notecards: Notecard[];
  currentNotecard: Notecard | null;
  searchQuery: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  loadNotecards: () => Promise<void>;
  createNotecard: (front?: string, back?: string) => Promise<Notecard>;
  updateNotecard: (
    id: string,
    updates: Partial<Omit<Notecard, 'id' | 'createdAt' | 'user_id'>>
  ) => Promise<void>;
  deleteNotecard: (id: string) => Promise<void>;
  setCurrentNotecard: (notecard: Notecard | null) => void;
  setSearchQuery: (query: string) => void;
  searchNotecards: (query: string) => Promise<Notecard[]>;
  clearError: () => void;
  // Utility function for getting notecard by ID (for embeds)
  getNotecardById: (id: string) => Notecard | undefined;
}

export const useNotecardsStore = create<NotecardsState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      notecards: [],
      currentNotecard: null,
      searchQuery: '',
      isLoading: false,
      isSaving: false,
      error: null,

      // Load all notecards for the current user
      loadNotecards: async () => {
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
          const notecards = await notecardsDatabase.getAllNotecards(
            authState.user.id
          );
          set({ notecards, isLoading: false });
        } catch (error) {
          console.error('Failed to load notecards:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load notecards',
            isLoading: false,
          });
        }
      },

      // Create a new notecard
      createNotecard: async (front = '', back = '') => {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('User not authenticated');
        }

        set({ isSaving: true, error: null });
        try {
          const newNotecard = await notecardsDatabase.createNotecard(
            { front, back },
            user.id
          );
          const { notecards } = get();
          set({
            notecards: [newNotecard, ...notecards],
            currentNotecard: newNotecard,
            isSaving: false,
          });

          // Queue for background sync
          await syncService.queueOperation({
            type: 'CREATE',
            table: 'notecards',
            data: newNotecard,
            userId: user.id,
          });

          return newNotecard;
        } catch (error) {
          console.error('Failed to create notecard:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to create notecard',
            isSaving: false,
          });
          throw error;
        }
      },

      // Update an existing notecard
      updateNotecard: async (id, updates) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('User not authenticated');
        }

        set({ isSaving: true, error: null });
        try {
          const updatedNotecard = await notecardsDatabase.updateNotecard(
            id,
            updates,
            user.id
          );
          const { notecards, currentNotecard } = get();

          const updatedNotecards = notecards.map((notecard) =>
            notecard.id === id ? updatedNotecard : notecard
          );

          // Sort by updatedAt to keep most recent first
          const sortedNotecards = updatedNotecards.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
          );

          set({
            notecards: sortedNotecards,
            currentNotecard:
              currentNotecard?.id === id ? updatedNotecard : currentNotecard,
            isSaving: false,
          });

          // Queue for background sync
          await syncService.queueOperation({
            type: 'UPDATE',
            table: 'notecards',
            data: updatedNotecard,
            userId: user.id,
          });
        } catch (error) {
          console.error('Failed to update notecard:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update notecard',
            isSaving: false,
          });
          throw error;
        }
      },

      // Delete a notecard and clean up embeds in notes
      deleteNotecard: async (id) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('User not authenticated');
        }

        set({ isLoading: true, error: null });
        try {
          // Get the notecard before deleting for sync queue
          const notecardToDelete = await notecardsDatabase.getNotecardById(
            id,
            user.id
          );

          // First, find all notes that contain embeds for this notecard
          const allNotes = await notesDatabase.getAllNotes(user.id);
          const notesWithEmbeds = findNotesWithNotecardEmbeds(allNotes, id);

          // Remove notecard embeds from affected notes
          const affectedNoteIds: string[] = [];
          for (const note of notesWithEmbeds) {
            const updatedContent = removeNotecardEmbedsFromContent(
              note.content,
              id
            );
            const updatedNote = await notesDatabase.updateNote(
              note.id,
              {
                content: updatedContent,
              },
              user.id
            );
            affectedNoteIds.push(note.id);

            // Queue note update for sync
            await syncService.queueOperation({
              type: 'UPDATE',
              table: 'notes',
              data: updatedNote,
              userId: user.id,
            });
          }

          // Notify notes store of updates if callback is set
          if (notifyNotesStoreUpdate && affectedNoteIds.length > 0) {
            notifyNotesStoreUpdate(affectedNoteIds);
          }

          // Then delete the notecard itself
          await notecardsDatabase.deleteNotecard(id, user.id);
          const { notecards, currentNotecard } = get();

          const filteredNotecards = notecards.filter(
            (notecard) => notecard.id !== id
          );
          const newCurrentNotecard =
            currentNotecard?.id === id ? null : currentNotecard;

          set({
            notecards: filteredNotecards,
            currentNotecard: newCurrentNotecard,
            isLoading: false,
          });

          // Queue notecard deletion for sync if notecard existed
          if (notecardToDelete) {
            await syncService.queueOperation({
              type: 'DELETE',
              table: 'notecards',
              data: notecardToDelete,
              userId: user.id,
            });
          }
        } catch (error) {
          console.error('Failed to delete notecard:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to delete notecard',
            isLoading: false,
          });
          throw error;
        }
      },

      // Set the current active notecard
      setCurrentNotecard: (notecard) => set({ currentNotecard: notecard }),

      // Set search query
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Search notecards
      searchNotecards: async (query) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('User not authenticated');
        }

        try {
          const results = await notecardsDatabase.searchNotecards(
            query,
            user.id
          );
          return results;
        } catch (error) {
          console.error('Failed to search notecards:', error);
          throw error;
        }
      },

      // Clear error state
      clearError: () => set({ error: null }),

      // Get notecard by ID (for embeds)
      getNotecardById: (id) => {
        const { notecards } = get();
        return notecards.find((notecard) => notecard.id === id);
      },
    })),
    { name: 'notecards-store' }
  )
);

// Set up auth state subscription to automatically load notecards when user becomes authenticated
useAuthStore.subscribe(
  (state) => ({
    user: state.user,
    session: state.session,
    isInitialized: state.isInitialized,
  }),
  (authState, prevAuthState) => {
    const notecardsStore = useNotecardsStore.getState();

    // Simple approach: if we have a user and no notecards, load them
    if (
      authState.user &&
      !notecardsStore.isLoading &&
      notecardsStore.notecards.length === 0
    ) {
      notecardsStore.loadNotecards();
    }

    // If user logged out, clear notecards and errors
    if (prevAuthState.user && !authState.user) {
      useNotecardsStore.setState({
        notecards: [],
        currentNotecard: null,
        error: null,
      });
    }
  }
);

// Selectors for easier consumption
export const useCurrentNotecard = () =>
  useNotecardsStore((state) => state.currentNotecard);
export const useNotecards = () => useNotecardsStore((state) => state.notecards);
export const useIsNotecardLoading = () =>
  useNotecardsStore((state) => state.isLoading);
export const useIsNotecardSaving = () =>
  useNotecardsStore((state) => state.isSaving);
export const useNotecardsError = () =>
  useNotecardsStore((state) => state.error);

// Get notecard by ID selector
export const useNotecardById = (id: string) => {
  return useNotecardsStore((state) =>
    state.notecards.find((notecard) => notecard.id === id)
  );
};

// Filtered notecards selector for backward compatibility
export const useFilteredNotecards = () => {
  const notecards = useNotecardsStore((state) => state.notecards);
  const searchQuery = useNotecardsStore((state) => state.searchQuery);

  if (!searchQuery.trim()) {
    return notecards;
  }

  const query = searchQuery.toLowerCase();
  return notecards.filter((notecard) => {
    const frontMatch = notecard.front.toLowerCase().includes(query);
    const backMatch = notecard.back.toLowerCase().includes(query);
    return frontMatch || backMatch;
  });
};
