import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { Notecard } from '@/types';
import { notecardsDatabase, notesDatabase } from '@/lib/database';
import {
  removeNotecardEmbedsFromContent,
  findNotesWithNotecardEmbeds,
} from '@/lib/editor';
import type { CreateNotecardInput, UpdateNotecardInput } from '@/types';

// Create a simplified interface for the store
const notecardsDB = {
  getAllNotecards: () => notecardsDatabase.getAllNotecards(),
  createNotecard: (front: string, back: string) =>
    notecardsDatabase.createNotecard({ front, back } as CreateNotecardInput),
  updateNotecard: (
    id: string,
    updates: Partial<Omit<Notecard, 'id' | 'createdAt'>>
  ) => notecardsDatabase.updateNotecard(id, updates as UpdateNotecardInput),
  deleteNotecard: (id: string) => notecardsDatabase.deleteNotecard(id),
  searchNotecards: (query: string) => notecardsDatabase.searchNotecards(query),
};

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
    updates: Partial<Omit<Notecard, 'id' | 'createdAt'>>
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

      // Actions
      loadNotecards: async () => {
        set({ isLoading: true, error: null });
        try {
          const notecards = await notecardsDB.getAllNotecards();
          set({ notecards, isLoading: false });
        } catch (error) {
          console.error('Failed to load notecards:', error);
          set({
            error: 'Failed to load notecards',
            isLoading: false,
          });
        }
      },

      createNotecard: async (front = '', back = '') => {
        set({ isSaving: true, error: null });
        try {
          const newNotecard = await notecardsDB.createNotecard(front, back);
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
            error: 'Failed to create notecard',
            isSaving: false,
          });
          throw error;
        }
      },

      updateNotecard: async (
        id: string,
        updates: Partial<Omit<Notecard, 'id' | 'createdAt'>>
      ) => {
        set({ isSaving: true, error: null });
        try {
          const updatedNotecard = await notecardsDB.updateNotecard(id, updates);
          const { notecards, currentNotecard } = get();

          const updatedNotecards = notecards.map((notecard) =>
            notecard.id === id ? updatedNotecard : notecard
          );

          set({
            notecards: updatedNotecards,
            currentNotecard:
              currentNotecard?.id === id ? updatedNotecard : currentNotecard,
            isSaving: false,
          });
        } catch (error) {
          console.error('Failed to update notecard:', error);
          set({
            error: 'Failed to update notecard',
            isSaving: false,
          });
          throw error;
        }
      },

      deleteNotecard: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // First, find all notes that contain embeds for this notecard
          const allNotes = await notesDatabase.getAllNotes();
          const notesWithEmbeds = findNotesWithNotecardEmbeds(allNotes, id);

          // Remove the notecard embeds from affected notes
          const affectedNoteIds: string[] = [];
          for (const note of notesWithEmbeds) {
            const updatedContent = removeNotecardEmbedsFromContent(
              note.content,
              id
            );
            await notesDatabase.updateNote(note.id, {
              content: updatedContent,
            });
            affectedNoteIds.push(note.id);
          }

          // Notify notes store of the updates if callback is available
          if (notifyNotesStoreUpdate && affectedNoteIds.length > 0) {
            notifyNotesStoreUpdate(affectedNoteIds);
          }

          // Then delete the notecard itself
          await notecardsDB.deleteNotecard(id);
          const { notecards, currentNotecard } = get();

          const filteredNotecards = notecards.filter(
            (notecard) => notecard.id !== id
          );
          // If we deleted the current notecard, set current to the most recent remaining notecard
          let newCurrentNotecard = currentNotecard;
          if (currentNotecard?.id === id) {
            newCurrentNotecard =
              filteredNotecards.length > 0 ? filteredNotecards[0] : null;
          }

          set({
            notecards: filteredNotecards,
            currentNotecard: newCurrentNotecard,
            isLoading: false,
          });

          // Log cleanup info for user feedback
          if (notesWithEmbeds.length > 0) {
            console.info(
              `Cleaned up notecard embeds from ${notesWithEmbeds.length} note(s)`
            );
          }
        } catch (error) {
          console.error('Failed to delete notecard:', error);
          set({
            error: 'Failed to delete notecard',
            isLoading: false,
          });
          throw error;
        }
      },

      setCurrentNotecard: (notecard: Notecard | null) => {
        set({ currentNotecard: notecard });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      searchNotecards: async (query: string) => {
        if (!query.trim()) {
          return get().notecards;
        }

        try {
          const results = await notecardsDB.searchNotecards(query);
          return results;
        } catch (error) {
          console.error('Failed to search notecards:', error);
          set({ error: 'Failed to search notecards' });
          return [];
        }
      },

      clearError: () => {
        set({ error: null });
      },

      getNotecardById: (id: string) => {
        const { notecards } = get();
        return notecards.find((notecard) => notecard.id === id);
      },
    })),
    {
      name: 'notecards-store', // For Redux DevTools
    }
  )
);

// Computed selectors for better performance
export const useFilteredNotecards = () => {
  const notecards = useNotecardsStore((state) => state.notecards);
  const searchQuery = useNotecardsStore((state) => state.searchQuery);

  let filteredNotecards = notecards;

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredNotecards = notecards.filter(
      (notecard) =>
        notecard.front.toLowerCase().includes(query) ||
        notecard.back.toLowerCase().includes(query)
    );
  }

  // Sort by updatedAt descending (most recently edited first)
  return filteredNotecards.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

// Selector for current notecard (used in notecard views)
export const useCurrentNotecard = () => {
  return useNotecardsStore((state) => state.currentNotecard);
};

// Selector for saving state (used in notecard editor)
export const useIsNotecardSaving = () => {
  return useNotecardsStore((state) => state.isSaving);
};

// Selector for a specific notecard by ID (used in embeds for real-time sync)
export const useNotecardById = (id: string) => {
  return useNotecardsStore((state) => {
    const notecard = state.notecards.find((notecard) => notecard.id === id);
    return notecard;
  });
};
