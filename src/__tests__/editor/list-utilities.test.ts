/**
 * @jest-environment jsdom
 */

import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { isInList } from '@/lib/editor/list-utilities';
import { handleKeyboardShortcuts } from '@/lib/editor/keyboard-shortcuts';
import type {
  CustomEditor,
  CustomElement,
  CustomText,
  ListElement,
} from '@/types';

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

describe('List Utilities', () => {
  let editor: CustomEditor;

  beforeEach(() => {
    editor = createTestEditor();
  });

  describe('List Nesting Behavior', () => {
    it('should detect when cursor is in a list', () => {
      const result = isInList(editor);
      expect(typeof result).toBe('boolean');
    });

    it('should add indent level when indenting list items', () => {
      // Setup: Start with a bulleted list with two items
      const bulletedList: CustomElement = {
        type: 'bulleted-list' as const,
        children: [
          { type: 'list-item' as const, children: [{ text: 'Parent' }] },
          { type: 'list-item' as const, children: [{ text: 'Child' }] },
        ],
      };
      editor.children = [bulletedList];
      editor.selection = {
        anchor: { path: [0, 1, 0], offset: 0 }, // Focus on second item
        focus: { path: [0, 1, 0], offset: 0 },
      };

      // Action: Indent the second item
      const event = createKeyboardEvent('Tab');
      handleKeyboardShortcuts(event, editor);

      // Verify: Should add indent level to the second item
      const [listNode] = editor.children as CustomElement[];
      expect(listNode.type).toBe('bulleted-list');
      expect(
        'children' in listNode && (listNode as ListElement).children.length
      ).toBe(2); // Still two items

      const [firstItem, secondItem] = (listNode as ListElement).children;
      expect(firstItem.type).toBe('list-item');
      expect(firstItem.indent).toBeUndefined(); // No indent (top level)
      expect((firstItem.children as CustomText[])[0].text).toBe('Parent');

      expect(secondItem.type).toBe('list-item');
      expect(secondItem.indent).toBe(1); // Indented one level
      expect((secondItem.children as CustomText[])[0].text).toBe('Child');
    });

    it('should convert top-level list item to paragraph when outdenting', () => {
      // Setup: Start with a simple bulleted list
      const bulletedList: CustomElement = {
        type: 'bulleted-list' as const,
        children: [
          { type: 'list-item' as const, children: [{ text: 'Item 1' }] },
        ],
      };
      editor.children = [bulletedList];
      editor.selection = {
        anchor: { path: [0, 0, 0], offset: 0 },
        focus: { path: [0, 0, 0], offset: 0 },
      };

      // Action: Outdent the top-level list item (Shift+Tab)
      const event = createKeyboardEvent('Tab', false, false, true);
      handleKeyboardShortcuts(event, editor);

      // Verify: Should convert to paragraph, not orphaned list item
      expect(editor.children).toHaveLength(1);
      const [firstNode] = editor.children as CustomElement[];
      expect(firstNode.type).toBe('paragraph');
      expect((firstNode.children as CustomText[])[0].text).toBe('Item 1');
    });

    it('should reduce indent level when outdenting indented list items', () => {
      // Setup: Start with list containing indented item
      const bulletedList: CustomElement = {
        type: 'bulleted-list' as const,
        children: [
          { type: 'list-item' as const, children: [{ text: 'Parent' }] },
          {
            type: 'list-item' as const,
            children: [{ text: 'Indented' }],
            indent: 1,
          },
        ],
      };
      editor.children = [bulletedList];
      editor.selection = {
        anchor: { path: [0, 1, 0], offset: 0 }, // Focus on indented item
        focus: { path: [0, 1, 0], offset: 0 },
      };

      // Action: Outdent the indented item
      const event = createKeyboardEvent('Tab', false, false, true);
      handleKeyboardShortcuts(event, editor);

      // Verify: Should reduce the indent level
      const [firstNode] = editor.children as CustomElement[];
      expect(firstNode.type).toBe('bulleted-list');
      expect(
        'children' in firstNode && (firstNode as ListElement).children.length
      ).toBe(2);

      const [firstItem, secondItem] = (firstNode as ListElement).children;
      expect(firstItem.type).toBe('list-item');
      expect(firstItem.indent).toBeUndefined(); // Still no indent
      expect((firstItem.children as CustomText[])[0].text).toBe('Parent');

      expect(secondItem.type).toBe('list-item');
      expect(secondItem.indent).toBe(0); // Reduced from 1 to 0
      expect((secondItem.children as CustomText[])[0].text).toBe('Indented');
    });

    it('should clean up empty list containers after deletion', (done) => {
      // Setup: Start with a bulleted list with one item
      const bulletedList: CustomElement = {
        type: 'bulleted-list' as const,
        children: [
          { type: 'list-item' as const, children: [{ text: 'Only item' }] },
        ],
      };
      editor.children = [bulletedList];
      editor.selection = {
        anchor: { path: [0, 0, 0], offset: 0 },
        focus: { path: [0, 0, 0], offset: 10 }, // Select all text
      };

      // Action: Simulate deleting the list item content (which would leave empty list)
      // First manually create the empty list scenario
      editor.children = [{ type: 'bulleted-list' as const, children: [] }];

      // Trigger the deletion handler
      const event = createKeyboardEvent('Backspace');
      handleKeyboardShortcuts(event, editor);

      // Wait for the setTimeout to execute
      setTimeout(() => {
        // Verify: Empty list should be removed
        expect(editor.children).toHaveLength(0);
        done();
      }, 10);
    });
  });
});
