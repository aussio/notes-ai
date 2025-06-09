'use client';

import { useCallback, useMemo } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import Toolbar from './Toolbar';
import RenderElement from './RenderElement';
import RenderLeaf from './RenderLeaf';
import { handleKeyboardShortcuts, handleMarkdownShortcuts } from '@/lib/editor';
import type { CustomEditor, CustomElement } from '@/types';

interface RichTextEditorProps {
  value: CustomElement[];
  onChange: (value: CustomElement[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
  editorKey?: string; // Force re-render when this changes
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  autoFocus = false,
  editorKey,
}: RichTextEditorProps) {
  // Create the editor with React and History plugins
  const editor = useMemo(
    () => withHistory(withReact(createEditor())) as CustomEditor,
    []
  );

  // Handle editor value changes
  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      onChange(newValue as CustomElement[]);
    },
    [onChange]
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Handle keyboard shortcuts (Ctrl/Cmd + B, I, U)
      if (handleKeyboardShortcuts(event, editor)) {
        return;
      }

      // Handle markdown shortcuts (# for headings, * for lists, etc.)
      if (handleMarkdownShortcuts(editor, event)) {
        return;
      }
    },
    [editor]
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
