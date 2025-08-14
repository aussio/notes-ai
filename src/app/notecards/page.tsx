'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import MainLayout from '@/components/layout/MainLayout';
import { NotecardEditor } from '@/components/notecards/NotecardEditor';
import { DeleteNotecardModal } from '@/components/notecards/DeleteNotecardModal';
import { NotecardStats } from '@/components/notecards/NotecardStats';
import { ReviewStatistics } from '@/components/review/ReviewStatistics';
import AuthGuard from '@/components/auth/AuthGuard';
import { useCurrentNotecard, useNotecardsStore } from '@/store/notecardsStore';
import { useNotesStore } from '@/store/notesStore';
import { useUser } from '@/store/authStore';
import { findNotesWithNotecardEmbeds } from '@/lib/editor';

export default function NotecardsPage() {
  const currentNotecard = useCurrentNotecard();
  const { deleteNotecard, loadNotecards, notecards, isLoading, error } =
    useNotecardsStore();
  const { notes } = useNotesStore();
  const user = useUser();
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load notecards when user becomes available (only if not already loaded)
  useEffect(() => {
    if (user && notecards.length === 0 && !isLoading && !error) {
      loadNotecards();
    }
  }, [user, notecards.length, isLoading, error, loadNotecards]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (currentNotecard) {
      await deleteNotecard(currentNotecard.id);
    }
  };

  const handleToggleDebug = () => {
    setIsDebugVisible(!isDebugVisible);
  };

  // Find notes that contain this notecard for the modal
  const notesContaining = currentNotecard
    ? findNotesWithNotecardEmbeds(notes, currentNotecard.id)
    : [];

  return (
    <AuthGuard>
      <MainLayout
        onDeleteNote={handleDeleteClick}
        onToggleDebug={handleToggleDebug}
        isDebugVisible={isDebugVisible}
      >
        <div className="h-full overflow-y-auto">
          {currentNotecard ? (
            <div className="flex flex-col h-full">
              {/* Individual Notecard Stats */}
              <div className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <NotecardStats notecardId={currentNotecard.id} />
              </div>

              {/* Notecard Editor */}
              <div className="flex-1">
                <NotecardEditor notecard={currentNotecard} />
              </div>
            </div>
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
                  Welcome to Notecards
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your cloud-first spaced repetition system. Select a notecard
                  from the sidebar to get started, or create a new notecard to
                  begin studying.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ☁️ All your notecards are securely stored in the cloud with
                    Supabase!
                  </p>
                </div>
              </div>

              {/* Review Statistics Dashboard */}
              <div className="max-w-6xl mx-auto">
                <ReviewStatistics />
              </div>
            </div>
          )}
        </div>
      </MainLayout>

      {/* Debug Panel for Notecards */}
      {currentNotecard && isDebugVisible && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notecard Debug
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ID: {currentNotecard.id}
              </span>
            </div>

            <button
              onClick={() => setIsDebugVisible(false)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              title="Close debug panel"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="overflow-auto max-h-64 p-4 font-mono text-xs">
            <pre className="text-gray-800 dark:text-gray-200">
              {JSON.stringify(currentNotecard, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <DeleteNotecardModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        notecardFront={currentNotecard?.front || ''}
        notesContaining={notesContaining}
      />
    </AuthGuard>
  );
}
