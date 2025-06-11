'use client';

import React, { useState, useEffect } from 'react';
import { RenderElementProps, useSlateStatic, ReactEditor } from 'slate-react';
import { Transforms, Path, Editor } from 'slate';
import { useNotecardById, useNotecardsStore } from '@/store/notecardsStore';
import { NotecardField } from './NotecardField';
import type { NotecardEmbedElement } from '@/types';

interface NotecardEmbedProps extends RenderElementProps {
  element: NotecardEmbedElement;
}

export const NotecardEmbed: React.FC<NotecardEmbedProps> = ({
  element,
  attributes,
}) => {
  const editor = useSlateStatic();
  const { updateNotecard, loadNotecards, notecards, deleteNotecard } =
    useNotecardsStore();
  // Use the reactive selector hook for real-time updates
  const notecard = useNotecardById(element.notecardId);
  const [focusedField, setFocusedField] = useState<'front' | 'back' | null>(
    null
  );
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load notecards if they haven't been loaded yet
  useEffect(() => {
    if (notecards.length === 0) {
      loadNotecards();
    }
  }, [notecards.length, loadNotecards]);

  // Check if this notecard should auto-focus (only for new, empty notecards on first render)
  useEffect(() => {
    if (notecard && !notecard.front && !notecard.back) {
      // This is an empty notecard - check if it's newly created
      // We'll assume it's newly created if it appears within a short time window
      const now = Date.now();
      const createdAt = new Date(notecard.createdAt).getTime();
      const isRecentlyCreated = now - createdAt < 2000; // 2 seconds window

      if (isRecentlyCreated) {
        setShouldAutoFocus(true);
        setIsEditing(true); // Mark as being edited
        // Clear the auto-focus flag after first use
        setTimeout(() => setShouldAutoFocus(false), 100);
      }
    }
  }, [notecard]);

  // Auto-delete empty notecards when user stops editing
  useEffect(() => {
    if (notecard && !isEditing && !notecard.front && !notecard.back) {
      // Notecard is empty and user has stopped editing - delete it
      const cleanup = setTimeout(() => {
        deleteNotecard(notecard.id);
      }, 1000); // 1 second delay to avoid immediate deletion

      return () => clearTimeout(cleanup);
    }
  }, [notecard, isEditing, deleteNotecard]);

  const handleSaveFront = async (value: string) => {
    if (!notecard) return;
    await updateNotecard(notecard.id, { front: value });
  };

  const handleSaveBack = async (value: string) => {
    if (!notecard) return;
    await updateNotecard(notecard.id, { back: value });
  };

  const handleTabToBack = () => {
    setFocusedField('back');
    // Reset after a short delay to ensure the effect triggers
    setTimeout(() => setFocusedField(null), 100);
  };

  const handleTabToFront = () => {
    setFocusedField('front');
    // Reset after a short delay to ensure the effect triggers
    setTimeout(() => setFocusedField(null), 100);
  };

  const handleFieldEditStart = () => {
    setIsEditing(true);
  };

  const handleFieldEditEnd = () => {
    setIsEditing(false);
  };

  const handleExitNotecard = () => {
    try {
      // Find the path of this notecard element using ReactEditor
      const notecardPath = ReactEditor.findPath(editor, element);

      // Calculate the path after this notecard
      const nextPath = Path.next(notecardPath);

      // Check if there's already a node after this notecard
      if (Editor.hasPath(editor, nextPath)) {
        // Move cursor to the beginning of the first text node in the next element
        Transforms.select(editor, { path: [...nextPath, 0], offset: 0 });
      } else {
        // Insert a new paragraph after the notecard and move cursor there
        const newParagraph = {
          type: 'paragraph' as const,
          children: [{ text: '' }],
        };

        Transforms.insertNodes(editor, newParagraph, {
          at: Path.next(notecardPath),
        });
        Transforms.select(editor, {
          path: [...Path.next(notecardPath), 0],
          offset: 0,
        });
      }

      // Focus the editor using ReactEditor - add delay to ensure DOM is ready
      setTimeout(() => {
        ReactEditor.focus(editor);
      }, 50);
    } catch (error) {
      console.error('Failed to exit notecard:', error);

      // Fallback: try to focus the editor even if path operations failed
      try {
        ReactEditor.focus(editor);
      } catch (focusError) {
        console.error('Failed to focus editor as fallback:', focusError);
      }
    }
  };

  return (
    <div {...attributes} className="my-2">
      <div contentEditable={false} className="relative">
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
          {notecard ? (
            <>
              {/* Front Row */}
              <NotecardField
                value={notecard.front}
                placeholder="Front of notecard"
                onSave={handleSaveFront}
                className="p-3 border-b border-gray-200 dark:border-gray-700"
                autoFocus={shouldAutoFocus}
                forceEdit={focusedField === 'front'}
                onTabNext={handleTabToBack}
                onEditStart={handleFieldEditStart}
                onEditEnd={handleFieldEditEnd}
              />

              {/* Back Row */}
              <NotecardField
                value={notecard.back}
                placeholder="Back of notecard"
                onSave={handleSaveBack}
                className="p-3"
                forceEdit={focusedField === 'back'}
                onTabPrevious={handleTabToFront}
                onTabExit={handleExitNotecard}
                onEditStart={handleFieldEditStart}
                onEditEnd={handleFieldEditEnd}
              />
            </>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">
                Notecard not found (ID: {element.notecardId})
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The referenced notecard may have been deleted
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
