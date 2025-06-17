'use client';

import { useCallback } from 'react';
import { useNotesStore } from '@/store/notesStore';
import RichTextEditor from './editor/RichTextEditor';
import type { CustomElement } from '@/types';

export default function NoteEditor() {
  const { updateNote, currentNote } = useNotesStore();

  // Handle content changes from the rich text editor (always update)
  const handleContentChange = useCallback(
    (newContent: CustomElement[]) => {
      if (!currentNote) return;
      updateNote(currentNote.id, { content: newContent });
    },
    [currentNote, updateNote]
  );

  // If no current note, show nothing (parent handles the empty state)
  if (!currentNote) {
    return null;
  }

  // Get current content or default empty content
  const content =
    currentNote.content && currentNote.content.length > 0
      ? currentNote.content
      : [{ type: 'paragraph' as const, children: [{ text: '' }] }];

  return (
    <RichTextEditor
      editorKey={currentNote.id} // Only use note ID to prevent unnecessary re-renders
      value={content}
      onChange={handleContentChange}
      placeholder="Start writing your note..."
      autoFocus
    />
  );
}
