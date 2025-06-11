import { RenderElementProps } from 'slate-react';
import { NotecardEmbed } from '@/components/notecards/NotecardEmbed';
import type { CustomElement, NotecardEmbedElement } from '@/types';

export default function RenderElement({
  attributes,
  children,
  element,
}: RenderElementProps) {
  const customElement = element as CustomElement;

  switch (customElement.type) {
    case 'heading':
      const level =
        (customElement as CustomElement & { level?: number }).level || 1;
      const headingClasses = {
        1: 'text-3xl font-bold mb-4 mt-6',
        2: 'text-2xl font-bold mb-3 mt-5',
        3: 'text-xl font-bold mb-2 mt-4',
      };

      const className = `${headingClasses[level as keyof typeof headingClasses]} text-gray-900 dark:text-white`;

      if (level === 1) {
        return (
          <h1 {...attributes} className={className}>
            {children}
          </h1>
        );
      } else if (level === 2) {
        return (
          <h2 {...attributes} className={className}>
            {children}
          </h2>
        );
      } else {
        return (
          <h3 {...attributes} className={className}>
            {children}
          </h3>
        );
      }

    case 'bulleted-list':
      return (
        <ul {...attributes} className="list-disc list-inside ml-4 mb-4">
          {children}
        </ul>
      );

    case 'numbered-list':
      return (
        <ol {...attributes} className="list-decimal list-inside ml-4 mb-4">
          {children}
        </ol>
      );

    case 'list-item':
      const indent =
        (customElement as CustomElement & { indent?: number }).indent || 0;
      const indentStyles =
        indent > 0 ? { marginLeft: `${indent * 1.5}rem` } : {};
      return (
        <li {...attributes} className="mb-1" style={indentStyles}>
          {children}
        </li>
      );

    case 'notecard-embed':
      return (
        <NotecardEmbed
          {...{
            attributes,
            children,
            element: customElement as NotecardEmbedElement,
          }}
        />
      );

    case 'paragraph':
    default:
      return (
        <p
          {...attributes}
          className="mb-2 leading-relaxed text-gray-800 dark:text-gray-200"
        >
          {children}
        </p>
      );
  }
}
