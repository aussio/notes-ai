'use client';

import { useCallback, useMemo } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import Toolbar from './Toolbar';
import RenderElement from './RenderElement';
import RenderLeaf from './RenderLeaf';
import { handleKeyboardShortcuts, handleMarkdownShortcuts } from '@/lib/editor';
import { useNotecardsStore } from '@/store/notecardsStore';
import type { CustomEditor, CustomElement } from '@/types';

interface RichTextEditorProps {
  value: CustomElement[];
  onChange: (value: CustomElement[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
  editorKey?: string; // Force re-render when this changes
}

// Configure editor with void elements
const withCustomElements = (editor: CustomEditor) => {
  const { isVoid } = editor;

  editor.isVoid = (element) => {
    return element.type === 'notecard-embed' ? true : isVoid(element);
  };

  return editor;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  autoFocus = false,
  editorKey,
}: RichTextEditorProps) {
  // Create the editor with React, History, and custom element plugins
  // Recreate editor when editorKey changes to ensure clean state
  const editor = useMemo(
    () =>
      withCustomElements(
        withHistory(withReact(createEditor())) as CustomEditor
      ),
    // editorKey is intentionally included to recreate editor instances
    // when switching between notes to prevent stale state issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editorKey]
  );

  // Access the notecard store for creating notecards
  const { createNotecard } = useNotecardsStore();

  // Handle editor value changes
  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      onChange(newValue as CustomElement[]);
    },
    [onChange]
  );

  // Create notecard function for markdown shortcuts
  const createNotecardForShortcut = useCallback(async () => {
    const newNotecard = await createNotecard();
    return { id: newNotecard.id };
  }, [createNotecard]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    async (event: React.KeyboardEvent) => {
      // Handle keyboard shortcuts (Ctrl/Cmd + B, I, U)
      if (handleKeyboardShortcuts(event, editor)) {
        return;
      }

      // Handle markdown shortcuts (# for headings, * for lists, >> for notecards, etc.)
      const handled = await handleMarkdownShortcuts(
        editor,
        event,
        createNotecardForShortcut
      );
      if (handled) {
        return;
      }
    },
    [editor, createNotecardForShortcut]
  );

  // Ensure we have valid content
  const validValue = useMemo(() => {
    if (!value || value.length === 0) {
      return [{ type: 'paragraph' as const, children: [{ text: '' }] }];
    }
    return value;
  }, [value]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950">
      <Slate
        key={editorKey}
        editor={editor}
        initialValue={validValue}
        onChange={handleChange}
      >
        <Toolbar />
        <div className="flex-1 overflow-auto">
          <Editable
            className="h-full p-6 outline-none"
            placeholder={placeholder}
            autoFocus={autoFocus}
            onKeyDown={handleKeyDown}
            renderElement={RenderElement}
            renderLeaf={RenderLeaf}
            spellCheck
          />
        </div>
      </Slate>
    </div>
  );
}
