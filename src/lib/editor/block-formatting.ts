import { Editor, Element, Transforms, Range } from 'slate';
import type { CustomEditor, TextElement, ListElement } from '@/types';

// Types for blocks that can be toggled (excluding notecard embeds)
type ToggleableBlockType = TextElement['type'] | ListElement['type'];

// Block formatting utilities
export const toggleBlock = (
  editor: CustomEditor,
  format: ToggleableBlockType
) => {
  const isActive = isBlockActive(editor, format);
  const isList = ['bulleted-list', 'numbered-list'].includes(format);

  // Unwrap any existing lists
  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      Element.isElement(n) &&
      ['bulleted-list', 'numbered-list'].includes(n.type),
    split: true,
  });

  // Convert list items back to paragraphs if toggling off
  if (isActive && isList) {
    Transforms.setNodes(editor, { type: 'paragraph' });
    return;
  }

  // Set the block type
  const newType = isActive ? 'paragraph' : format;

  if (isList) {
    // For lists, set as list-item and wrap in list container
    Transforms.setNodes(editor, { type: 'list-item' });
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  } else {
    // For other blocks, just set the type
    Transforms.setNodes(editor, { type: newType });
  }
};

export const isBlockActive = (
  editor: CustomEditor,
  format: ToggleableBlockType
) => {
  const { selection } = editor;
  if (!selection || !Range.isRange(selection)) return false;

  try {
    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: (n) =>
          !Editor.isEditor(n) && Element.isElement(n) && n.type === format,
      })
    );

    return !!match;
  } catch (error) {
    // If there's an error with the path, return false
    console.warn('Error checking block active state:', error);
    return false;
  }
};
