// Text formatting
export { toggleMark, isMarkActive } from './text-formatting';

// Block formatting
export { toggleBlock, isBlockActive } from './block-formatting';

// List utilities
export {
  isListActive,
  isInList,
  indentListItem,
  outdentListItem,
  handleListDeletion,
} from './list-utilities';

// Heading utilities
export { toggleHeading } from './heading-utilities';

// Keyboard shortcuts
export {
  handleKeyboardShortcuts,
  addKeyboardShortcut,
  addSpecialKeyHandler,
  modifierKeyShortcuts,
  specialKeyHandlers,
} from './keyboard-shortcuts';

// Markdown shortcuts
export {
  handleMarkdownShortcuts,
  addMarkdownShortcut,
  removeMarkdownShortcut,
  markdownShortcuts,
} from './markdown-shortcuts';

// Serialization
export {
  serializeToPlainText,
  deserializeFromPlainText,
} from './serialization';

// Rendering
export { getElementProps, getTextProps } from './rendering';

// Re-export types for convenience
export type { KeyboardShortcutHandler } from './keyboard-shortcuts';
export type { MarkdownShortcut } from './markdown-shortcuts';
