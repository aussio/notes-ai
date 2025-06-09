import { Editor } from 'slate';
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
  const marks = Editor.marks(editor);
  return marks ? (marks as Record<string, unknown>)[format] === true : false;
};
