import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { Note } from '@/types';
import { notesDatabase } from '@/lib/database';
import type { CreateNoteInput, UpdateNoteInput } from '@/types';
import { TEMP_USER_ID } from '@/types';
import { setNotesStoreUpdateCallback } from './notecardsStore';

// Create a simplified interface for the store
const notesDB = {
  getAllNotes: () => notesDatabase.getAllNotes(TEMP_USER_ID),
  createNote: (title: string, content: unknown[]) =>
    notesDatabase.createNote(
      { title, content } as CreateNoteInput,
      TEMP_USER_ID
    ),
  updateNote: (id: string, updates: UpdateNoteInput) =>
    notesDatabase.updateNote(id, updates, TEMP_USER_ID),
  deleteNote: (id: string) => notesDatabase.deleteNote(id, TEMP_USER_ID),
  searchNotes: (query: string) =>
    notesDatabase.searchNotes(query, TEMP_USER_ID),
  getNoteById: (id: string) => notesDatabase.getNoteById(id, TEMP_USER_ID),
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

      // Actions
      loadNotes: async () => {
        set({ isLoading: true, error: null });
        try {
          const notes = await notesDB.getAllNotes();
          set({ notes, isLoading: false });
        } catch (error) {
          console.error('Failed to load notes:', error);
          set({
            error: 'Failed to load notes',
            isLoading: false,
          });
        }
      },

      createNote: async (
        title = 'Untitled Note',
        content = [{ type: 'paragraph', children: [{ text: '' }] }]
      ) => {
        set({ isSaving: true, error: null });
        try {
          const newNote = await notesDB.createNote(title, content);
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
            error: 'Failed to create note',
            isSaving: false,
          });
          throw error;
        }
      },

      updateNote: async (
        id: string,
        updates: Partial<Omit<Note, 'id' | 'createdAt' | 'user_id'>>
      ) => {
        set({ isSaving: true, error: null });
        try {
          const updatedNote = await notesDB.updateNote(id, updates);
          const { notes, currentNote } = get();

          const updatedNotes = notes.map((note) =>
            note.id === id ? updatedNote : note
          );

          set({
            notes: updatedNotes,
            currentNote: currentNote?.id === id ? updatedNote : currentNote,
            isSaving: false,
          });
        } catch (error) {
          console.error('Failed to update note:', error);
          set({
            error: 'Failed to update note',
            isSaving: false,
          });
          throw error;
        }
      },

      deleteNote: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await notesDB.deleteNote(id);
          const { notes, currentNote } = get();

          const filteredNotes = notes.filter((note) => note.id !== id);
          // If we deleted the current note, set current to the most recent remaining note
          let newCurrentNote = currentNote;
          if (currentNote?.id === id) {
            newCurrentNote = filteredNotes.length > 0 ? filteredNotes[0] : null;
          }

          set({
            notes: filteredNotes,
            currentNote: newCurrentNote,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to delete note:', error);
          set({
            error: 'Failed to delete note',
            isLoading: false,
          });
          throw error;
        }
      },

      setCurrentNote: (note: Note | null) => {
        set({ currentNote: note });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      searchNotes: async (query: string) => {
        if (!query.trim()) {
          return get().notes;
        }

        try {
          const results = await notesDB.searchNotes(query);
          return results;
        } catch (error) {
          console.error('Failed to search notes:', error);
          set({ error: 'Failed to search notes' });
          return [];
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Internal method to refresh specific notes from database
      refreshNotes: async (noteIds: string[]) => {
        try {
          const { notes, currentNote } = get();
          const updatedNotes = [...notes];
          let updatedCurrentNote = currentNote;

          for (const noteId of noteIds) {
            // Get fresh note from database
            const freshNote = await notesDB.getNoteById(noteId);
            if (freshNote) {
              // Update in the notes array
              const noteIndex = updatedNotes.findIndex(
                (note) => note.id === noteId
              );
              if (noteIndex !== -1) {
                updatedNotes[noteIndex] = freshNote;
              }

              // Update current note if it's the one being refreshed
              if (currentNote?.id === noteId) {
                updatedCurrentNote = freshNote;
              }
            }
          }

          set({
            notes: updatedNotes,
            currentNote: updatedCurrentNote,
          });
        } catch (error) {
          console.error('Failed to refresh notes:', error);
        }
      },
    })),
    {
      name: 'notes-store', // For Redux DevTools
    }
  )
);

// Set up the callback for notecard store to notify when notes need updating
if (typeof window !== 'undefined') {
  // Only register on client side
  const store = useNotesStore.getState();
  setNotesStoreUpdateCallback((affectedNoteIds: string[]) => {
    store.refreshNotes(affectedNoteIds);
  });
}

// Computed selectors for better performance
export const useFilteredNotes = () => {
  const notes = useNotesStore((state) => state.notes);
  const searchQuery = useNotesStore((state) => state.searchQuery);

  let filteredNotes = notes;

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredNotes = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        // Simple content search - could be enhanced with full-text search
        JSON.stringify(note.content).toLowerCase().includes(query)
    );
  }

  // Sort by updatedAt descending (most recently edited first)
  return filteredNotes.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

// Selector for current note title (used in header)
export const useCurrentNoteTitle = () => {
  return useNotesStore((state) => state.currentNote?.title ?? 'Untitled Note');
};

// Selector for saving state (used in header)
export const useIsSaving = () => {
  return useNotesStore((state) => state.isSaving);
};
