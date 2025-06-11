'use client';

import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
} from 'lucide-react';
import { useSlate } from 'slate-react';
import { Editor, Element } from 'slate';
import {
  toggleMark,
  isMarkActive,
  toggleBlock,
  isBlockActive,
  toggleHeading,
} from '@/lib/editor';
import type { CustomElement, TextElement, ListElement } from '@/types';

// Type for blocks that can be toggled (matching the one in block-formatting.ts)
type ToggleableBlockType = TextElement['type'] | ListElement['type'];

interface ToolbarButtonProps {
  active: boolean;
  onMouseDown: (event: React.MouseEvent) => void;
  children: React.ReactNode;
  title?: string;
}

const ToolbarButton = ({
  active,
  onMouseDown,
  children,
  title,
}: ToolbarButtonProps) => (
  <button
    type="button"
    className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
      active
        ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
        : 'text-gray-600 dark:text-gray-400'
    }`}
    onMouseDown={onMouseDown}
    title={title}
  >
    {children}
  </button>
);

interface MarkButtonProps {
  format: 'bold' | 'italic' | 'underline';
  icon: React.ReactNode;
  title: string;
}

const MarkButton = ({ format, icon, title }: MarkButtonProps) => {
  const editor = useSlate();

  return (
    <ToolbarButton
      active={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
      title={title}
    >
      {icon}
    </ToolbarButton>
  );
};

interface BlockButtonProps {
  format: ToggleableBlockType;
  icon: React.ReactNode;
  title: string;
}

const BlockButton = ({ format, icon, title }: BlockButtonProps) => {
  const editor = useSlate();

  return (
    <ToolbarButton
      active={isBlockActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
      title={title}
    >
      {icon}
    </ToolbarButton>
  );
};

interface HeadingButtonProps {
  level: 1 | 2 | 3;
  icon: React.ReactNode;
  title: string;
}

const HeadingButton = ({ level, icon, title }: HeadingButtonProps) => {
  const editor = useSlate();

  // Check if current block is a heading with this level
  const isActive =
    isBlockActive(editor, 'heading') &&
    // Check the level property of the current heading
    (() => {
      const { selection } = editor;
      if (!selection) return false;

      const [match] = Array.from(
        Editor.nodes(editor, {
          at: selection,
          match: (n) =>
            !Editor.isEditor(n) &&
            Element.isElement(n) &&
            n.type === 'heading' &&
            (n as CustomElement & { level?: number }).level === level,
        })
      );

      return !!match;
    })();

  return (
    <ToolbarButton
      active={isActive}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleHeading(editor, level);
      }}
      title={title}
    >
      {icon}
    </ToolbarButton>
  );
};

export default function Toolbar() {
  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Text formatting */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-gray-700">
        <MarkButton
          format="bold"
          icon={<Bold size={16} />}
          title="Bold (Ctrl+B)"
        />
        <MarkButton
          format="italic"
          icon={<Italic size={16} />}
          title="Italic (Ctrl+I)"
        />
        <MarkButton
          format="underline"
          icon={<Underline size={16} />}
          title="Underline (Ctrl+U)"
        />
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-gray-700">
        <HeadingButton
          level={1}
          icon={<Heading1 size={16} />}
          title="Heading 1 (# + space)"
        />
        <HeadingButton
          level={2}
          icon={<Heading2 size={16} />}
          title="Heading 2 (## + space)"
        />
        <HeadingButton
          level={3}
          icon={<Heading3 size={16} />}
          title="Heading 3 (### + space)"
        />
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 pl-2">
        <BlockButton
          format="bulleted-list"
          icon={<List size={16} />}
          title="Bullet List (* + space)"
        />
        <BlockButton
          format="numbered-list"
          icon={<ListOrdered size={16} />}
          title="Numbered List (1. + space)"
        />
      </div>
    </div>
  );
}
