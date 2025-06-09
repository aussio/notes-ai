'use client';

import { useCallback, useMemo } from 'react';
import { useNotesStore } from '@/store/notesStore';
import { useSmartSave } from '@/hooks/useSmartSave';
import type { Note, CustomElement } from '@/types';

interface NoteEditorProps {
  note: Note;
}

export default function NoteEditor({ note }: NoteEditorProps) {
  const { updateNote } = useNotesStore();

  // Extract text content from the note's structured content
  const extractText = useCallback((noteContent: CustomElement[]): string => {
    if (!noteContent || noteContent.length === 0) return '';

    try {
      // Extract text from Slate.js format with text nodes
      return noteContent
        .map((paragraph: CustomElement) => {
          return paragraph.children.map((child) => child.text || '').join('');
        })
        .join('\n');
    } catch {
      return '';
    }
  }, []);

  // Memoize the extracted text to detect note changes
  const currentNoteContent = useMemo(
    () => extractText(note.content),
    [note.content, extractText]
  );

  // Create a stable onSave callback that always uses the current note
  const handleSave = useCallback(
    async (newContent: string) => {
      // Convert plain text back to structured format
      const structuredContent = newContent.split('\n').map((line) => ({
        type: 'paragraph' as const,
        children: [{ text: line }],
      }));

      await updateNote(note.id, { content: structuredContent });
    },
    [note.id, updateNote]
  );

  // Create a stable shouldSave callback that always compares with current note
  const handleShouldSave = useCallback(
    (newValue: string) => {
      // Convert to structured format to compare properly
      const newStructured = newValue.split('\n').map((line) => ({
        type: 'paragraph' as const,
        children: [{ text: line }],
      }));

      return JSON.stringify(newStructured) !== JSON.stringify(note.content);
    },
    [note.content]
  );

  const {
    value: content,
    setValue: setContent,
    save: saveContent,
  } = useSmartSave({
    initialValue: currentNoteContent,
    saveOnEveryKeystroke: true, // Real-time saving for local storage
    onSave: handleSave,
    shouldSave: handleShouldSave,
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950">
      {/* Content textarea */}
      <div className="flex-1 p-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={saveContent}
          placeholder="Start writing your note..."
          className="w-full h-full resize-none bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  );
}
