/**
 * @jest-environment jsdom
 */

import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { toggleBlock, isBlockActive } from '@/lib/editor/block-formatting';
import type { CustomEditor } from '@/types';

// Helper to create a test editor
const createTestEditor = (): CustomEditor => {
  return withHistory(withReact(createEditor())) as CustomEditor;
};

describe('Block Formatting', () => {
  let editor: CustomEditor;

  beforeEach(() => {
    editor = createTestEditor();
  });

  describe('toggleBlock', () => {
    it('should call toggleBlock without throwing', () => {
      expect(() => toggleBlock(editor, 'heading')).not.toThrow();
    });

    it('should handle different block types', () => {
      expect(() => toggleBlock(editor, 'bulleted-list')).not.toThrow();
      expect(() => toggleBlock(editor, 'numbered-list')).not.toThrow();
    });
  });

  describe('isBlockActive', () => {
    it('should return boolean for block status', () => {
      const result = isBlockActive(editor, 'heading');
      expect(typeof result).toBe('boolean');
    });
  });
});
