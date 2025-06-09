import type { CustomElement, CustomText } from '@/types';

// Serialization utilities
export const serializeToPlainText = (nodes: CustomElement[]): string => {
  return nodes
    .map((node) => {
      if (
        node.type === 'paragraph' ||
        node.type === 'heading' ||
        node.type === 'list-item'
      ) {
        // These nodes contain text children
        return (node.children as CustomText[])
          .map((child) => child.text)
          .join('');
      }
      // Handle list containers by extracting text from their children
      if (node.type === 'bulleted-list' || node.type === 'numbered-list') {
        return '';
      }
      return '';
    })
    .filter((text) => text.trim() !== '') // Remove empty lines
    .join(' '); // Join with spaces for preview
};

export const deserializeFromPlainText = (text: string): CustomElement[] => {
  if (!text.trim()) {
    return [{ type: 'paragraph', children: [{ text: '' }] }];
  }

  return text.split('\n').map((line) => ({
    type: 'paragraph' as const,
    children: [{ text: line }],
  }));
};
