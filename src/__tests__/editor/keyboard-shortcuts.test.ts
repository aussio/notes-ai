/**
 * @jest-environment jsdom
 */

import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { handleKeyboardShortcuts } from '@/lib/editor/keyboard-shortcuts';
import type { CustomEditor, CustomElement, ListElement } from '@/types';
import { Transforms } from 'slate';

// Helper to create a test editor
const createTestEditor = (): CustomEditor => {
  return withHistory(withReact(createEditor())) as CustomEditor;
};

// Helper to create a mock keyboard event
const createKeyboardEvent = (
  key: string,
  metaKey = false,
  ctrlKey = false,
  shiftKey = false
): React.KeyboardEvent => {
  return {
    key,
    metaKey,
    ctrlKey,
    shiftKey,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  } as unknown as React.KeyboardEvent;
};

describe('Keyboard Shortcuts', () => {
  let editor: CustomEditor;

  beforeEach(() => {
    editor = createTestEditor();
  });

  describe('handleKeyboardShortcuts', () => {
    it('should handle Ctrl+B for bold', () => {
      const event = createKeyboardEvent('b', false, true);
      const result = handleKeyboardShortcuts(event, editor);

      expect(result).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle Cmd+B for bold on Mac', () => {
      const event = createKeyboardEvent('b', true, false);
      const result = handleKeyboardShortcuts(event, editor);

      expect(result).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle Ctrl+I for italic', () => {
      const event = createKeyboardEvent('i', false, true);
      const result = handleKeyboardShortcuts(event, editor);

      expect(result).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle Ctrl+U for underline', () => {
      const event = createKeyboardEvent('u', false, true);
      const result = handleKeyboardShortcuts(event, editor);

      expect(result).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not handle keys without modifiers', () => {
      const event = createKeyboardEvent('b', false, false);
      const result = handleKeyboardShortcuts(event, editor);

      expect(result).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not handle unrecognized shortcuts', () => {
      const event = createKeyboardEvent('x', false, true);
      const result = handleKeyboardShortcuts(event, editor);

      expect(result).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not handle Tab when not in a list', () => {
      // Setup editor with normal paragraph (not in list)
      editor.children = [
        { type: 'paragraph', children: [{ text: 'Regular text' }] },
      ];
      editor.selection = {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 0 },
      };

      const event = createKeyboardEvent('Tab');
      const result = handleKeyboardShortcuts(event, editor);

      expect(result).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Enter key', () => {
    it('creates a new paragraph after a heading', () => {
      const editor = createTestEditor();
      const initialValue: CustomElement[] = [
        {
          type: 'heading',
          level: 1,
          children: [{ text: 'My Heading' }],
        },
      ];

      editor.children = initialValue;
      Transforms.select(editor, [0, 0]); // Select in the heading

      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;

      const handled = handleKeyboardShortcuts(mockEvent, editor);

      expect(handled).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(editor.children).toHaveLength(2);
      expect((editor.children[1] as CustomElement).type).toBe('paragraph');
    });

    it('converts empty list item to paragraph outside the list', () => {
      const editor = createTestEditor();
      const initialValue: CustomElement[] = [
        {
          type: 'bulleted-list',
          children: [
            {
              type: 'list-item',
              children: [{ text: 'Item 1' }],
            },
            {
              type: 'list-item',
              children: [{ text: '' }], // Empty list item
            },
          ],
        },
      ];

      editor.children = initialValue;
      Transforms.select(editor, [0, 1, 0]); // Select in the empty list item

      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;

      const handled = handleKeyboardShortcuts(mockEvent, editor);

      expect(handled).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();

      // Should have a list with one item and a paragraph after it
      expect(editor.children).toHaveLength(2);
      expect((editor.children[0] as CustomElement).type).toBe('bulleted-list');
      expect((editor.children[0] as ListElement).children).toHaveLength(1);
      expect((editor.children[1] as CustomElement).type).toBe('paragraph');
    });

    it('removes empty list container when converting the only list item', () => {
      const editor = createTestEditor();
      const initialValue: CustomElement[] = [
        {
          type: 'bulleted-list',
          children: [
            {
              type: 'list-item',
              children: [{ text: '' }], // Only empty list item
            },
          ],
        },
      ];

      editor.children = initialValue;
      Transforms.select(editor, [0, 0, 0]); // Select in the empty list item

      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;

      const handled = handleKeyboardShortcuts(mockEvent, editor);

      expect(handled).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();

      // Should have just a paragraph (list was removed)
      expect(editor.children).toHaveLength(1);
      expect((editor.children[0] as CustomElement).type).toBe('paragraph');
    });

    it('does not handle Enter on non-empty list items', () => {
      const editor = createTestEditor();
      const initialValue: CustomElement[] = [
        {
          type: 'bulleted-list',
          children: [
            {
              type: 'list-item',
              children: [{ text: 'Non-empty item' }],
            },
          ],
        },
      ];

      editor.children = initialValue;
      Transforms.select(editor, [0, 0, 0]); // Select in the non-empty list item

      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;

      const handled = handleKeyboardShortcuts(mockEvent, editor);

      expect(handled).toBe(false);
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('does not handle Enter on regular paragraphs', () => {
      const editor = createTestEditor();
      const initialValue: CustomElement[] = [
        {
          type: 'paragraph',
          children: [{ text: 'Regular paragraph' }],
        },
      ];

      editor.children = initialValue;
      Transforms.select(editor, [0, 0]); // Select in the paragraph

      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;

      const handled = handleKeyboardShortcuts(mockEvent, editor);

      expect(handled).toBe(false);
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });
});
