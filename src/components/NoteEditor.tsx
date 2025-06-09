'use client';

import { useState, useEffect } from 'react';
import { useNotesStore } from '@/store/notesStore';
import type { Note, CustomElement } from '@/types';

interface NoteEditorProps {
  note: Note;
}

export default function NoteEditor({ note }: NoteEditorProps) {
  const { updateNote, isSaving } = useNotesStore();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState('');

  // Extract text content from the note's structured content
  useEffect(() => {
    const extractText = (noteContent: CustomElement[]): string => {
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
    };

    setTitle(note.title);
    setContent(extractText(note.content));
  }, [note]);

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    if (newTitle.trim() !== note.title) {
      await updateNote(note.id, { title: newTitle.trim() || 'Untitled Note' });
    }
  };

  const handleContentChange = async (newContent: string) => {
    setContent(newContent);

    // Convert plain text back to structured format
    const structuredContent = newContent.split('\n').map((line) => ({
      type: 'paragraph' as const,
      children: [{ text: line }],
    }));

    if (JSON.stringify(structuredContent) !== JSON.stringify(note.content)) {
      await updateNote(note.id, { content: structuredContent });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950">
      {/* Title input */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={(e) => handleTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          placeholder="Note title..."
          className="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        {isSaving && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Saving...
          </p>
        )}
      </div>

      {/* Content textarea */}
      <div className="flex-1 p-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing your note..."
          className="w-full h-full resize-none bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  );
}
