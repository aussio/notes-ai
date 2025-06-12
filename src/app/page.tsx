'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import NoteEditor from '@/components/NoteEditor';
import SlateDebugPanel from '@/components/editor/SlateDebugPanel';
import {
  useNotesStore,
  useCurrentNoteTitle,
  useIsSaving,
} from '@/store/notesStore';

export default function Home() {
  const { loadNotes, currentNote, deleteNote, updateNote } = useNotesStore();
  const currentNoteTitle = useCurrentNoteTitle();
  const isSaving = useIsSaving();
  const [isDebugVisible, setIsDebugVisible] = useState(false);

  // Load notes when the component mounts
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleDeleteNote = async () => {
    if (currentNote) {
      await deleteNote(currentNote.id);
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    if (currentNote) {
      await updateNote(currentNote.id, { title: newTitle });
    }
  };

  const handleToggleDebug = () => {
    setIsDebugVisible(!isDebugVisible);
  };

  return (
    <>
      <MainLayout
        currentNoteTitle={currentNoteTitle}
        isSaving={isSaving}
        onDeleteNote={handleDeleteNote}
        onTitleChange={handleTitleChange}
        onToggleDebug={handleToggleDebug}
        isDebugVisible={isDebugVisible}
      >
        {currentNote ? (
          <NoteEditor />
        ) : (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Welcome to Notes
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your local-first note-taking app. Select a note from the sidebar
                to get started, or create a new note to begin writing.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 All your notes are stored locally on your device. No
                  internet connection required!
                </p>
              </div>
              <div className="mt-6 text-xs text-gray-400 dark:text-gray-600">
                🚀 Deployed via GitHub Actions • Build:{' '}
                {new Date().toISOString().split('T')[0]}
              </div>
            </div>
          </div>
        )}
      </MainLayout>

      {/* Debug Panel */}
      {currentNote && (
        <SlateDebugPanel
          editorValue={currentNote.content}
          isVisible={isDebugVisible}
          onClose={() => setIsDebugVisible(false)}
        />
      )}
    </>
  );
}
