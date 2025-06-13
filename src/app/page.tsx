'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import NoteEditor from '@/components/NoteEditor';
import SlateDebugPanel from '@/components/editor/SlateDebugPanel';
import { DeleteNoteModal } from '@/components/notes/DeleteNoteModal';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  useNotesStore,
  useCurrentNoteTitle,
  useIsSaving,
} from '@/store/notesStore';
import { useUser } from '@/store/authStore';
import { CustomElement } from '@/types';
import Image from 'next/image';

export default function Home() {
  const {
    currentNote,
    deleteNote,
    updateNote,
    loadNotes,
    notes,
    isLoading,
    error,
  } = useNotesStore();
  const currentNoteTitle = useCurrentNoteTitle();
  const isSaving = useIsSaving();
  const user = useUser();
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load notes when user becomes available (only if not already loaded)
  useEffect(() => {
    if (user && notes.length === 0 && !isLoading && !error) {
      loadNotes();
    }
  }, [user, notes.length, isLoading, error, loadNotes]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
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

  // Check if current note has embedded notecards
  const hasEmbeddedNotecards = currentNote
    ? currentNote.content.some(
        (element: CustomElement) => element.type === 'notecard-embed'
      )
    : false;

  return (
    <AuthGuard>
      <MainLayout
        currentNoteTitle={currentNoteTitle}
        isSaving={isSaving}
        onDeleteNote={handleDeleteClick}
        onTitleChange={handleTitleChange}
        onToggleDebug={handleToggleDebug}
        isDebugVisible={isDebugVisible}
      >
        {currentNote ? (
          <NoteEditor />
        ) : (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-md">
              <div className="flex items-center justify-center mb-6">
                <Image
                  src="/teal_duck_logo.png"
                  alt="Teal Duck Logo"
                  width={64}
                  height={64}
                />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Welcome to Notes
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your cloud-first note-taking app. Select a note from the sidebar
                to get started, or create a new note to begin writing.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ☁️ All your notes are securely stored in the cloud with
                  Supabase!
                </p>
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

      {/* Delete confirmation modal */}
      <DeleteNoteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        note={currentNote}
        hasEmbeddedNotecards={hasEmbeddedNotecards}
      />
    </AuthGuard>
  );
}
