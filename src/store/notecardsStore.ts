import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { Notecard } from '@/types';
import { notecardsDB, notesDB } from '@/lib/database-adapter';
import {
  removeNotecardEmbedsFromContent,
  findNotesWithNotecardEmbeds,
} from '@/lib/editor';

import { useAuthStore } from '@/store/authStore';

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
          const notecards = await notecardsDB.getAllNotecards(
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
          const newNotecard = await notecardsDB.createNotecard(
            { front, back },
            user.id
          );
          const { notecards } = get();
          set({
            notecards: [newNotecard, ...notecards],
            currentNotecard: newNotecard,
            isSaving: false,
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
          const updatedNotecard = await notecardsDB.updateNotecard(
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
          // First, find all notes that contain embeds for this notecard
          const allNotes = await notesDB.getAllNotes(user.id);
          const notesWithEmbeds = findNotesWithNotecardEmbeds(allNotes, id);

          // Remove notecard embeds from affected notes
          const affectedNoteIds: string[] = [];
          for (const note of notesWithEmbeds) {
            const updatedContent = removeNotecardEmbedsFromContent(
              note.content,
              id
            );
            await notesDB.updateNote(
              note.id,
              {
                content: updatedContent,
              },
              user.id
            );
            affectedNoteIds.push(note.id);
          }

          // Notify notes store of updates if callback is set
          if (notifyNotesStoreUpdate && affectedNoteIds.length > 0) {
            notifyNotesStoreUpdate(affectedNoteIds);
          }

          // Then delete the notecard itself
          await notecardsDB.deleteNotecard(id, user.id);
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
          const results = await notecardsDB.searchNotecards(query, user.id);
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
