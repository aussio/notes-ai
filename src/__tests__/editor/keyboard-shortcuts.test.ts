/**
 * @jest-environment jsdom
 */

import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { handleKeyboardShortcuts } from '@/lib/editor/keyboard-shortcuts';
import type { CustomEditor } from '@/types';

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
});
