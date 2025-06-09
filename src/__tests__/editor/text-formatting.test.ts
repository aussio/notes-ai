/**
 * @jest-environment jsdom
 */

import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { toggleMark, isMarkActive } from '@/lib/editor/text-formatting';
import type { CustomEditor } from '@/types';

// Helper to create a test editor
const createTestEditor = (): CustomEditor => {
  return withHistory(withReact(createEditor())) as CustomEditor;
};

describe('Text Formatting', () => {
  let editor: CustomEditor;

  beforeEach(() => {
    editor = createTestEditor();
  });

  describe('toggleMark', () => {
    it('should call toggleMark without throwing', () => {
      expect(() => toggleMark(editor, 'bold')).not.toThrow();
    });

    it('should handle different mark types', () => {
      expect(() => toggleMark(editor, 'italic')).not.toThrow();
      expect(() => toggleMark(editor, 'underline')).not.toThrow();
    });
  });

  describe('isMarkActive', () => {
    it('should return boolean for mark status', () => {
      const result = isMarkActive(editor, 'bold');
      expect(typeof result).toBe('boolean');
    });
  });
});
