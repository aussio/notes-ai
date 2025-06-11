import { Editor, Element, Transforms, Range } from 'slate';
import type { CustomEditor, NotecardEmbedElement } from '@/types';

/**
 * Insert a notecard embed at the current selection
 */
export const insertNotecardEmbed = (
  editor: CustomEditor,
  notecardId: string
): void => {
  const { selection } = editor;

  if (!selection) return;

  // Create the notecard embed element
  const notecardEmbed: NotecardEmbedElement = {
    type: 'notecard-embed',
    notecardId,
    children: [{ text: '' }], // Required by Slate even for void elements
  };

  // Check if we're in an empty paragraph that we should replace
  const [match] = Editor.nodes(editor, {
    match: (n) => Element.isElement(n) && n.type === 'paragraph',
  });

  const isInEmptyParagraph =
    match && Element.isElement(match[0]) && Editor.isEmpty(editor, match[0]);

  // If text is selected, delete it first
  if (!Range.isCollapsed(selection)) {
    Transforms.delete(editor);
  }

  if (isInEmptyParagraph) {
    // Delete the empty paragraph and insert the notecard
    Transforms.delete(editor);
    Transforms.insertNodes(editor, notecardEmbed);
  } else {
    // Insert the notecard embed normally
    Transforms.insertNodes(editor, notecardEmbed);
  }
};

/**
 * Check if the current selection contains a notecard embed
 */
export const isNotecardEmbedActive = (editor: CustomEditor): boolean => {
  const [match] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      Element.isElement(n) &&
      n.type === 'notecard-embed',
  });

  return !!match;
};

/**
 * Get the notecard embed element at the current selection, if any
 */
export const getCurrentNotecardEmbed = (
  editor: CustomEditor
): NotecardEmbedElement | null => {
  const [match] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      Element.isElement(n) &&
      n.type === 'notecard-embed',
  });

  return match ? (match[0] as NotecardEmbedElement) : null;
};
