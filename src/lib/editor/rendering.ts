import type { CustomElement, CustomText } from '@/types';

// Element rendering utilities
export const getElementProps = (element: CustomElement) => {
  const baseProps = {
    className: 'outline-none',
  };

  switch (element.type) {
    case 'heading':
      const level = (element as CustomElement & { level?: number }).level || 1;
      return {
        ...baseProps,
        className: `outline-none text-${level === 1 ? '3xl' : level === 2 ? '2xl' : 'xl'} font-bold mb-4`,
      };
    case 'list-item':
      const indent =
        (element as CustomElement & { indent?: number }).indent || 0;
      return {
        ...baseProps,
        className: `outline-none`,
        style: { marginLeft: `${indent * 24}px` }, // 24px per indent level
      };
    case 'bulleted-list':
      return {
        ...baseProps,
        className: 'outline-none list-disc ml-6 pl-0',
      };
    case 'numbered-list':
      return {
        ...baseProps,
        className: 'outline-none list-decimal ml-6 pl-0',
      };
    default:
      return {
        ...baseProps,
        className: 'outline-none mb-2',
      };
  }
};

// Text rendering utilities
export const getTextProps = (text: CustomText) => {
  const className = [
    text.bold && 'font-bold',
    text.italic && 'italic',
    text.underline && 'underline',
  ]
    .filter(Boolean)
    .join(' ');

  return { className };
};
