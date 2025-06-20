'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import NoteEditor from '@/components/NoteEditor';
import SlateDebugPanel from '@/components/editor/SlateDebugPanel';
import { DeleteNoteModal } from '@/components/notes/DeleteNoteModal';
import AuthGuard from '@/components/auth/AuthGuard';
import PWAInstallBanner from '@/components/layout/PWAInstallBanner';
import { useNotesStore, useCurrentNoteTitle } from '@/store/notesStore';
import { CustomElement } from '@/types';
import Image from 'next/image';

export default function Home() {
  const { currentNote, deleteNote, updateNote } = useNotesStore();
  const currentNoteTitle = useCurrentNoteTitle();
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shouldAutoFocusTitle, setShouldAutoFocusTitle] = useState(false);
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
    // Clear the auto-focus flag after title is changed
    setShouldAutoFocusTitle(false);
  };

  const handleToggleDebug = () => {
    setIsDebugVisible(!isDebugVisible);
  };

  // Detect when a new note is created (title is empty) to auto-focus title
  useEffect(() => {
    if (currentNote && (!currentNoteTitle || currentNoteTitle.trim() === '')) {
      setShouldAutoFocusTitle(true);
    } else {
      setShouldAutoFocusTitle(false);
    }
  }, [currentNote, currentNoteTitle]);

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
        onDeleteNote={handleDeleteClick}
        onTitleChange={handleTitleChange}
        onToggleDebug={handleToggleDebug}
        isDebugVisible={isDebugVisible}
        autoFocusTitle={shouldAutoFocusTitle}
      >
        {currentNote ? (
          <NoteEditor />
        ) : (
          <div className="p-8 space-y-8">
            {/* Welcome Section */}
            <div className="text-center max-w-lg mx-auto">
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
                Your cloud-first note-taking app with spaced repetition
                learning.
              </p>

              {/* PWA Install Banner */}
              <PWAInstallBanner />

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
