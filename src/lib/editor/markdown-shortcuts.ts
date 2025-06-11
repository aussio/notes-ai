import { Editor, Transforms } from 'slate';
import type { CustomEditor, CustomElement } from '@/types';
import { toggleBlock } from './block-formatting';
import { insertNotecardEmbed } from './notecard-utilities';

// Markdown shortcut pattern type
export interface MarkdownShortcut {
  pattern: RegExp;
  handler: (
    editor: CustomEditor,
    match: RegExpMatchArray
  ) => Promise<void> | void;
  description: string;
  requiresStore?: boolean; // Indicates if this shortcut needs access to store
}

// Default markdown shortcuts
export const markdownShortcuts: MarkdownShortcut[] = [
  // Heading shortcuts
  {
    pattern: /^(#{1,3})$/,
    handler: (editor, match) => {
      const level = match[1].length as 1 | 2 | 3;
      Transforms.setNodes(editor, {
        type: 'heading',
        level,
      } as Partial<CustomElement>);
    },
    description: 'Convert # ## ### to headings',
  },

  // Bulleted list shortcuts
  {
    pattern: /^(\*|-)$/,
    handler: (editor) => {
      toggleBlock(editor, 'bulleted-list');
    },
    description: 'Convert * or - to bulleted list',
  },

  // Numbered list shortcuts
  {
    pattern: /^\d+\.$/,
    handler: (editor) => {
      toggleBlock(editor, 'numbered-list');
    },
    description: 'Convert 1. 2. etc. to numbered list',
  },

  // Notecard embed shortcut
  {
    pattern: /^>>$/,
    handler: async () => {
      // This handler will be called with createNotecard function from the component
      // The actual implementation is in handleMarkdownShortcuts below
    },
    description: 'Convert >> to notecard embed',
    requiresStore: true,
  },
];

// Main markdown shortcut handler
export const handleMarkdownShortcuts = async (
  editor: CustomEditor,
  event: React.KeyboardEvent,
  createNotecard?: () => Promise<{ id: string }>
) => {
  if (event.key !== ' ') return false;

  const { selection } = editor;
  if (!selection || selection.anchor.offset === 0) return false;

  // Get the current line start and cursor position
  const [start] = Editor.edges(editor, selection);
  const lineStart = Editor.start(editor, start.path.slice(0, -1));

  const beforeRange = Editor.range(editor, lineStart, start);
  const beforeText = Editor.string(editor, beforeRange);

  // Check each markdown shortcut
  for (const shortcut of markdownShortcuts) {
    const match = beforeText.match(shortcut.pattern);
    if (match) {
      event.preventDefault();

      // Delete the markdown syntax
      Transforms.delete(editor, { at: beforeRange });

      // Handle notecard embed specially
      if (shortcut.pattern.source === '^>>$') {
        if (!createNotecard) {
          console.warn('createNotecard function not provided for >> shortcut');
          return false;
        }
        try {
          const newNotecard = await createNotecard();
          insertNotecardEmbed(editor, newNotecard.id);
        } catch (error) {
          console.error('Failed to create notecard for >> shortcut:', error);
          return false;
        }
      } else {
        // Apply the regular transformation
        await shortcut.handler(editor, match);
      }
      return true;
    }
  }

  return false;
};

// Utility to add new markdown shortcuts
export const addMarkdownShortcut = (shortcut: MarkdownShortcut) => {
  markdownShortcuts.push(shortcut);
};

// Utility to remove markdown shortcuts by pattern
export const removeMarkdownShortcut = (pattern: RegExp) => {
  const index = markdownShortcuts.findIndex(
    (shortcut) =>
      shortcut.pattern.source === pattern.source &&
      shortcut.pattern.flags === pattern.flags
  );
  if (index !== -1) {
    markdownShortcuts.splice(index, 1);
  }
};
