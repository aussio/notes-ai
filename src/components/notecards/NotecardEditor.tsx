'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useNotecardsStore, useIsNotecardSaving } from '@/store/notecardsStore';
import type { Notecard } from '@/types';

interface NotecardEditorProps {
  notecard: Notecard | null;
  className?: string;
}

export const NotecardEditor: React.FC<NotecardEditorProps> = ({
  notecard,
  className = '',
}) => {
  const { updateNotecard } = useNotecardsStore();
  const isSaving = useIsNotecardSaving();
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  // Update local state when notecard changes
  useEffect(() => {
    if (notecard) {
      setFront(notecard.front);
      setBack(notecard.back);
    }
  }, [notecard]);

  // Auto-save function with debounce - same pattern as notes
  const debouncedSave = useCallback(
    (newFront: string, newBack: string) => {
      if (!notecard) return;

      // Only save if content actually changed
      if (newFront !== notecard.front || newBack !== notecard.back) {
        const timeoutId = setTimeout(async () => {
          try {
            await updateNotecard(notecard.id, {
              front: newFront,
              back: newBack,
            });
          } catch (error) {
            console.error('Failed to save notecard:', error);
          }
        }, 500); // 500ms debounce like notes

        return () => clearTimeout(timeoutId);
      }
    },
    [notecard, updateNotecard]
  );

  // Auto-save when content changes
  useEffect(() => {
    if (!notecard) return;

    const cleanup = debouncedSave(front, back);
    return cleanup;
  }, [front, back, notecard, debouncedSave]);

  const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFront(e.target.value);
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBack(e.target.value);
  };

  if (!notecard) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">No notecard selected</p>
          <p className="text-sm">
            Select a notecard from the sidebar to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-gray-950 ${className}`}
    >
      {/* Header - minimal like notes */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Edit Notecard
        </h2>
        {isSaving && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Saving...
          </span>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Front */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Front
          </label>
          <textarea
            value={front}
            onChange={handleFrontChange}
            placeholder="Enter the front side of your notecard..."
            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            autoFocus
          />
        </div>

        {/* Back */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Back
          </label>
          <textarea
            value={back}
            onChange={handleBackChange}
            placeholder="Enter the back side of your notecard..."
            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Preview
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Front
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {front || 'Empty front'}
                </p>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Back
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {back || 'Empty back'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
