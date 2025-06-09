/**
 * @jest-environment jsdom
 */

import {
  serializeToPlainText,
  deserializeFromPlainText,
} from '@/lib/editor/serialization';
import type { CustomElement } from '@/types';

describe('Serialization', () => {
  describe('serializeToPlainText', () => {
    it('should serialize simple text', () => {
      const content: CustomElement[] = [
        { type: 'paragraph', children: [{ text: 'Hello world' }] },
      ];

      const result = serializeToPlainText(content);
      expect(result).toBe('Hello world');
    });

    it('should serialize headings', () => {
      const content: CustomElement[] = [
        { type: 'heading', level: 1, children: [{ text: 'Title' }] },
      ];

      const result = serializeToPlainText(content);
      expect(result).toBe('Title');
    });

    it('should serialize lists', () => {
      const content: CustomElement[] = [
        { type: 'list-item', children: [{ text: 'Item 1' }] },
      ];

      const result = serializeToPlainText(content);
      expect(result).toBe('Item 1');
    });

    it('should handle empty content', () => {
      const result = serializeToPlainText([]);
      expect(result).toBe('');
    });
  });

  describe('deserializeFromPlainText', () => {
    it('should deserialize simple text', () => {
      const result = deserializeFromPlainText('Hello world');

      expect(result).toEqual([
        { type: 'paragraph', children: [{ text: 'Hello world' }] },
      ]);
    });

    it('should handle empty text', () => {
      const result = deserializeFromPlainText('');

      expect(result).toEqual([{ type: 'paragraph', children: [{ text: '' }] }]);
    });

    it('should handle multiline text', () => {
      const result = deserializeFromPlainText('Line 1\nLine 2');

      expect(result).toEqual([
        { type: 'paragraph', children: [{ text: 'Line 1' }] },
        { type: 'paragraph', children: [{ text: 'Line 2' }] },
      ]);
    });
  });
});
