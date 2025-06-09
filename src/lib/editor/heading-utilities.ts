import { Transforms } from 'slate';
import type { CustomEditor, CustomElement } from '@/types';
import { isBlockActive } from './block-formatting';

// Heading utilities
export const toggleHeading = (editor: CustomEditor, level: 1 | 2 | 3 = 1) => {
  const headingType = 'heading' as const;
  const isActive = isBlockActive(editor, headingType);

  if (isActive) {
    Transforms.setNodes(editor, { type: 'paragraph' });
  } else {
    Transforms.setNodes(editor, {
      type: headingType,
      level,
    } as Partial<CustomElement>);
  }
};
