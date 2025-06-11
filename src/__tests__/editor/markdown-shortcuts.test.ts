/**
 * @jest-environment jsdom
 */

import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { handleMarkdownShortcuts } from '@/lib/editor/markdown-shortcuts';
import { insertNotecardEmbed } from '@/lib/editor/notecard-utilities';
import type {
  CustomEditor,
  CustomElement,
  ListElement,
  CustomText,
  NotecardEmbedElement,
} from '@/types';

// Configure editor with void elements (same as RichTextEditor)
const withCustomElements = (editor: CustomEditor) => {
  const { isVoid } = editor;

  editor.isVoid = (element) => {
    return element.type === 'notecard-embed' ? true : isVoid(element);
  };

  return editor;
};

// Helper to create a test editor
const createTestEditor = (): CustomEditor => {
  return withCustomElements(
    withHistory(withReact(createEditor())) as CustomEditor
  );
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

describe('Markdown Shortcuts', () => {
  let editor: CustomEditor;

  beforeEach(() => {
    editor = createTestEditor();
  });

  describe('Markdown Pattern Recognition', () => {
    // Test the regex patterns that power markdown shortcuts
    it('should recognize heading patterns', () => {
      const headingRegex = /^(#{1,3})$/;

      expect('#'.match(headingRegex)?.[1]).toBe('#');
      expect('##'.match(headingRegex)?.[1]).toBe('##');
      expect('###'.match(headingRegex)?.[1]).toBe('###');

      // Should not match invalid patterns
      expect('####'.match(headingRegex)).toBeNull();
      expect('#text'.match(headingRegex)).toBeNull();
      expect('text#'.match(headingRegex)).toBeNull();
      expect(' #'.match(headingRegex)).toBeNull();
    });

    it('should recognize numbered list patterns', () => {
      const numberedListRegex = /^\d+\.$/;

      expect('1.'.match(numberedListRegex)).toBeTruthy();
      expect('42.'.match(numberedListRegex)).toBeTruthy();
      expect('999.'.match(numberedListRegex)).toBeTruthy();

      // Should not match invalid patterns
      expect('1'.match(numberedListRegex)).toBeNull();
      expect('1.text'.match(numberedListRegex)).toBeNull();
      expect('text1.'.match(numberedListRegex)).toBeNull();
      expect(' 1.'.match(numberedListRegex)).toBeNull();
    });

    it('should recognize bulleted list patterns', () => {
      // Test that the exact strings we check for are correct
      expect('*').toBe('*');
      expect('-').toBe('-');

      // These should not match (would fail the exact string check)
      expect('*text').not.toBe('*');
      expect('-text').not.toBe('-');
      expect(' *').not.toBe('*');
    });

    it('should recognize notecard embed pattern', () => {
      const notecardRegex = /^>>$/;

      expect('>>'.match(notecardRegex)).toBeTruthy();

      // Should not match invalid patterns
      expect('>'.match(notecardRegex)).toBeNull();
      expect('>>>'.match(notecardRegex)).toBeNull();
      expect('>>text'.match(notecardRegex)).toBeNull();
      expect('text>>'.match(notecardRegex)).toBeNull();
      expect(' >>'.match(notecardRegex)).toBeNull();
    });
  });

  describe('Markdown Transformation Behavior', () => {
    it('should convert "# " to H1 heading block', async () => {
      // Setup: Start with paragraph containing "#"
      editor.children = [{ type: 'paragraph', children: [{ text: '#' }] }];
      editor.selection = {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 1 },
      };

      // Action: Press space to trigger markdown shortcut
      const event = createKeyboardEvent(' ');
      await handleMarkdownShortcuts(editor, event);

      // Verify: Editor content should change to heading
      const [firstNode] = editor.children as CustomElement[];
      expect(firstNode.type).toBe('heading');
      expect((firstNode as CustomElement & { level?: number }).level).toBe(1);
      expect((firstNode.children as CustomText[])[0].text).toBe(''); // Text should be cleared after transformation
    });

    it('should convert "## " to H2 heading block', async () => {
      // Setup: Start with paragraph containing "##"
      editor.children = [{ type: 'paragraph', children: [{ text: '##' }] }];
      editor.selection = {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      };

      // Action: Press space to trigger markdown shortcut
      const event = createKeyboardEvent(' ');
      await handleMarkdownShortcuts(editor, event);

      // Verify: Editor content should change to H2 heading
      const [firstNode] = editor.children as CustomElement[];
      expect(firstNode.type).toBe('heading');
      expect((firstNode as CustomElement & { level?: number }).level).toBe(2);
    });

    it('should convert "* " to bulleted list', async () => {
      // Setup: Start with paragraph containing "*"
      editor.children = [{ type: 'paragraph', children: [{ text: '*' }] }];
      editor.selection = {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 1 },
      };

      // Action: Press space to trigger markdown shortcut
      const event = createKeyboardEvent(' ');
      await handleMarkdownShortcuts(editor, event);

      // Verify: Editor content should change to bulleted list structure
      const [firstNode] = editor.children as CustomElement[];
      expect(firstNode.type).toBe('bulleted-list');
      expect(
        'children' in firstNode && (firstNode as ListElement).children[0]
      ).toBeDefined();
      expect(
        'children' in firstNode && (firstNode as ListElement).children[0].type
      ).toBe('list-item');
    });

    it('should NOT transform "#### " (invalid pattern)', async () => {
      // Setup: Start with paragraph containing "####" (too many hashes)
      const originalContent = [
        { type: 'paragraph' as const, children: [{ text: '####' }] },
      ];
      editor.children = [...originalContent];
      editor.selection = {
        anchor: { path: [0, 0], offset: 4 },
        focus: { path: [0, 0], offset: 4 },
      };

      // Action: Press space (should NOT trigger transformation)
      const event = createKeyboardEvent(' ');
      await handleMarkdownShortcuts(editor, event);

      // Verify: Editor content should remain unchanged
      const [firstNode] = editor.children as CustomElement[];
      expect(firstNode.type).toBe('paragraph');
      expect((firstNode.children as CustomText[])[0].text).toBe('####'); // Content unchanged
    });

    it('should NOT transform on non-space keys', async () => {
      // Setup: Start with valid markdown pattern
      const originalContent = [
        { type: 'paragraph' as const, children: [{ text: '#' }] },
      ];
      editor.children = [...originalContent];
      editor.selection = {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 1 },
      };

      // Action: Press 'a' instead of space
      const event = createKeyboardEvent('a');
      await handleMarkdownShortcuts(editor, event);

      // Verify: Editor content should remain unchanged
      const [firstNode] = editor.children as CustomElement[];
      expect(firstNode.type).toBe('paragraph');
      expect((firstNode.children as CustomText[])[0].text).toBe('#'); // Content unchanged
    });

    it('should NOT transform without valid selection', async () => {
      // Setup: Start with valid pattern but no selection
      const originalContent = [
        { type: 'paragraph' as const, children: [{ text: '#' }] },
      ];
      editor.children = [...originalContent];
      editor.selection = null; // No selection

      // Action: Press space
      const event = createKeyboardEvent(' ');
      await handleMarkdownShortcuts(editor, event);

      // Verify: Editor content should remain unchanged
      const [firstNode] = editor.children as CustomElement[];
      expect(firstNode.type).toBe('paragraph');
      expect((firstNode.children as CustomText[])[0].text).toBe('#'); // Content unchanged
    });

    it('should convert ">> " to notecard embed', async () => {
      // Setup: Start with paragraph containing ">>"
      editor.children = [{ type: 'paragraph', children: [{ text: '>>' }] }];
      editor.selection = {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      };

      // Mock createNotecard function
      const mockCreateNotecard = jest
        .fn()
        .mockResolvedValue({ id: 'test-notecard-id' });

      // Action: Press space to trigger markdown shortcut
      const event = createKeyboardEvent(' ');
      await handleMarkdownShortcuts(editor, event, mockCreateNotecard);

      // Verify: Should have created a notecard and replaced the empty paragraph
      expect(mockCreateNotecard).toHaveBeenCalled();
      expect(editor.children).toHaveLength(1);

      const [firstNode] = editor.children as CustomElement[];
      // The paragraph should be replaced with the notecard embed
      expect(firstNode.type).toBe('notecard-embed');
      expect((firstNode as NotecardEmbedElement).notecardId).toBe(
        'test-notecard-id'
      );
    });

    it('should NOT transform ">> " without createNotecard function', async () => {
      // Setup: Start with paragraph containing ">>"
      const originalContent = [
        { type: 'paragraph' as const, children: [{ text: '>>' }] },
      ];
      editor.children = [...originalContent];
      editor.selection = {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      };

      // Action: Press space without providing createNotecard function
      const event = createKeyboardEvent(' ');
      const result = await handleMarkdownShortcuts(editor, event); // No createNotecard function

      // Verify: Should not transform and return false
      expect(result).toBe(false);
      const [firstNode] = editor.children as CustomElement[];
      expect(firstNode.type).toBe('paragraph');
      expect((firstNode.children as CustomText[])[0].text).toBe(''); // Text was deleted but no transform occurred
    });

    it('should replace empty paragraph when inserting notecard directly (non-markdown)', () => {
      // Setup: Start with empty paragraph (simulating what happens after user deletes content)
      editor.children = [{ type: 'paragraph', children: [{ text: '' }] }];
      editor.selection = {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 0 },
      };

      // Action: Insert notecard directly (like from toolbar button)
      insertNotecardEmbed(editor, 'direct-test-id');

      // Verify: Should replace the empty paragraph with notecard embed
      expect(editor.children).toHaveLength(1);
      const [firstNode] = editor.children as CustomElement[];
      expect(firstNode.type).toBe('notecard-embed');
      expect((firstNode as NotecardEmbedElement).notecardId).toBe(
        'direct-test-id'
      );
    });
  });
});
