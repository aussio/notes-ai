import type { CustomEditor } from '@/types';
import { toggleMark } from './text-formatting';
import {
  indentListItem,
  outdentListItem,
  handleListDeletion,
} from './list-utilities';

// Keyboard shortcut handler type
export type KeyboardShortcutHandler = (
  editor: CustomEditor,
  event: React.KeyboardEvent
) => boolean;

// Special key handlers (Tab, Shift+Tab, etc.)
export const specialKeyHandlers: Record<string, KeyboardShortcutHandler> = {
  Tab: (editor, event) => {
    if (event.shiftKey) {
      // Shift+Tab: outdent list item
      return outdentListItem(editor);
    } else {
      // Tab: indent list item
      return indentListItem(editor);
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Backspace: (editor, _event) => {
    // Handle list cleanup after deletion
    return handleListDeletion(editor);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Delete: (editor, _event) => {
    // Handle list cleanup after deletion
    return handleListDeletion(editor);
  },
};

// Modifier key shortcuts (Cmd/Ctrl + key)
export const modifierKeyShortcuts: Record<
  string,
  {
    handler: (editor: CustomEditor) => void;
    description: string;
  }
> = {
  b: {
    handler: (editor) => toggleMark(editor, 'bold'),
    description: 'Toggle bold',
  },
  i: {
    handler: (editor) => toggleMark(editor, 'italic'),
    description: 'Toggle italic',
  },
  u: {
    handler: (editor) => toggleMark(editor, 'underline'),
    description: 'Toggle underline',
  },
};

// Main keyboard shortcut handler
export const handleKeyboardShortcuts = (
  event: React.KeyboardEvent,
  editor: CustomEditor
) => {
  // Handle special keys (Tab, Enter, etc.)
  if (specialKeyHandlers[event.key]) {
    const handled = specialKeyHandlers[event.key](editor, event);
    if (handled) {
      event.preventDefault();
      return true;
    }
    return false;
  }

  // Handle modifier key shortcuts (Cmd/Ctrl + key)
  if (event.metaKey || event.ctrlKey) {
    const shortcut = modifierKeyShortcuts[event.key];
    if (shortcut) {
      event.preventDefault();
      shortcut.handler(editor);
      return true;
    }
  }

  return false;
};

// Utility to add new keyboard shortcuts
export const addKeyboardShortcut = (
  key: string,
  handler: (editor: CustomEditor) => void,
  description: string
) => {
  modifierKeyShortcuts[key] = { handler, description };
};

// Utility to add new special key handlers
export const addSpecialKeyHandler = (
  key: string,
  handler: KeyboardShortcutHandler
) => {
  specialKeyHandlers[key] = handler;
};
