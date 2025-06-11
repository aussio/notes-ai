'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { NotecardEditor } from '@/components/notecards/NotecardEditor';
import {
  useCurrentNotecard,
  useNotecardsStore,
  useIsNotecardSaving,
} from '@/store/notecardsStore';

export default function NotecardsPage() {
  const currentNotecard = useCurrentNotecard();
  const { loadNotecards, deleteNotecard, updateNotecard } = useNotecardsStore();
  const isSaving = useIsNotecardSaving();
  const [isDebugVisible, setIsDebugVisible] = useState(false);

  // Load notecards when the page mounts
  useEffect(() => {
    loadNotecards();
  }, [loadNotecards]);

  const handleDeleteNotecard = async () => {
    if (currentNotecard) {
      if (window.confirm('Are you sure you want to delete this notecard?')) {
        await deleteNotecard(currentNotecard.id);
      }
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    if (currentNotecard) {
      // For notecards, we'll update the front text when the "title" is changed
      await updateNotecard(currentNotecard.id, { front: newTitle });
    }
  };

  const handleToggleDebug = () => {
    setIsDebugVisible(!isDebugVisible);
  };

  // Get the current "title" for the header - use front text
  const currentTitle = currentNotecard?.front || undefined;

  return (
    <>
      <MainLayout
        currentNoteTitle={currentTitle}
        isSaving={isSaving}
        onDeleteNote={handleDeleteNotecard}
        onTitleChange={handleTitleChange}
        onToggleDebug={handleToggleDebug}
        isDebugVisible={isDebugVisible}
      >
        {currentNotecard ? (
          <NotecardEditor notecard={currentNotecard} />
        ) : (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Welcome to Notecards
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your local-first spaced repetition system. Select a notecard
                from the sidebar to get started, or create a new notecard to
                begin studying.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 All your notecards are stored locally on your device. No
                  internet connection required!
                </p>
              </div>
            </div>
          </div>
        )}
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
    </>
  );
}
