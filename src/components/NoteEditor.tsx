'use client';

import { useCallback } from 'react';
import { useNotesStore } from '@/store/notesStore';
import RichTextEditor from './editor/RichTextEditor';
import type { Note, CustomElement } from '@/types';

interface NoteEditorProps {
  note: Note;
}

export default function NoteEditor({ note }: NoteEditorProps) {
  const { updateNote } = useNotesStore();

  // Get current content or default empty content
  const content =
    note.content && note.content.length > 0
      ? note.content
      : [{ type: 'paragraph' as const, children: [{ text: '' }] }];

  // Handle content changes from the rich text editor
  const handleContentChange = useCallback(
    async (newContent: CustomElement[]) => {
      // Only save if content actually changed
      if (JSON.stringify(newContent) !== JSON.stringify(note.content)) {
        await updateNote(note.id, { content: newContent });
      }
    },
    [note.id, note.content, updateNote]
  );

  return (
    <RichTextEditor
      editorKey={note.id} // Force re-render when note changes
      value={content}
      onChange={handleContentChange}
      placeholder="Start writing your note..."
      autoFocus
    />
  );
}
