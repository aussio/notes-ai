import { Editor, Range } from 'slate';
import type { CustomEditor, CustomText } from '@/types';

// Text formatting utilities
export const toggleMark = (
  editor: CustomEditor,
  format: keyof Omit<CustomText, 'text'>
) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export const isMarkActive = (
  editor: CustomEditor,
  format: keyof Omit<CustomText, 'text'>
) => {
  // Check if editor has a valid selection
  if (!editor.selection || !Range.isRange(editor.selection)) {
    return false;
  }

  try {
    const marks = Editor.marks(editor);
    return marks ? (marks as Record<string, unknown>)[format] === true : false;
  } catch (error) {
    // If there's an error getting marks (e.g., invalid path), return false
    console.warn('Error checking mark active state:', error);
    return false;
  }
};
