import { Editor, Element, Transforms } from 'slate';
import type { CustomEditor, CustomElement } from '@/types';
import { isBlockActive } from './block-formatting';

// List utilities
export const isListActive = (editor: CustomEditor) => {
  return (
    isBlockActive(editor, 'bulleted-list') ||
    isBlockActive(editor, 'numbered-list')
  );
};

export const isInList = (editor: CustomEditor) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: (n) =>
        !Editor.isEditor(n) && Element.isElement(n) && n.type === 'list-item',
    })
  );

  return !!match;
};

export const indentListItem = (editor: CustomEditor) => {
  if (!isInList(editor)) return false;

  const { selection } = editor;
  if (!selection) return false;

  // Get the current list item
  const [listItemMatch] = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: (n) =>
        !Editor.isEditor(n) && Element.isElement(n) && n.type === 'list-item',
    })
  );

  if (!listItemMatch) return false;

  const [currentListItem, currentListItemPath] = listItemMatch;
  const currentIndent = (currentListItem as CustomElement).indent || 0;

  // Check if this is the first item in the list - can't indent if so
  if (currentListItemPath[currentListItemPath.length - 1] === 0) {
    return false;
  }

  // Increase the indent level
  Transforms.setNodes(
    editor,
    { indent: currentIndent + 1 },
    { at: currentListItemPath }
  );

  return true;
};

export const outdentListItem = (editor: CustomEditor) => {
  if (!isInList(editor)) return false;

  const { selection } = editor;
  if (!selection) return false;

  // Get the current list item
  const [listItemMatch] = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: (n) =>
        !Editor.isEditor(n) && Element.isElement(n) && n.type === 'list-item',
      mode: 'lowest',
    })
  );

  if (!listItemMatch) return false;

  const [, listItemPath] = listItemMatch;

  // Get the immediate parent list (the one that directly contains this list item)
  const [parentList, parentListPath] = Editor.parent(editor, listItemPath);

  if (
    !Element.isElement(parentList) ||
    (parentList.type !== 'bulleted-list' && parentList.type !== 'numbered-list')
  ) {
    return false;
  }

  // Get current indent level
  const currentIndent = (listItemMatch[0] as CustomElement).indent || 0;

  if (currentIndent > 0) {
    // This is an indented item - reduce the indent level
    Transforms.setNodes(
      editor,
      { indent: currentIndent - 1 },
      { at: listItemPath }
    );
  } else {
    // This is a top-level list item - convert it to a paragraph and move it out of the list
    const wasOnlyItem =
      Element.isElement(parentList) && parentList.children.length === 1;

    Transforms.setNodes(editor, { type: 'paragraph' }, { at: listItemPath });

    // Move the paragraph out of the list container
    Transforms.moveNodes(editor, {
      at: listItemPath,
      to: [parentListPath[0] + 1], // Insert after the list
    });

    // If this was the only item in the list, remove the now-empty list container
    if (wasOnlyItem) {
      Transforms.removeNodes(editor, {
        at: parentListPath,
      });
    }
  }

  return true;
};

export const handleListDeletion = (editor: CustomEditor) => {
  const { selection } = editor;
  if (!selection) return false;

  // Let the default deletion happen first
  setTimeout(() => {
    // Check if we're in a list after deletion
    const { selection: newSelection } = editor;
    if (!newSelection) return;

    // Find any empty list containers
    const [listMatch] = Array.from(
      Editor.nodes(editor, {
        at: [],
        match: (n) =>
          !Editor.isEditor(n) &&
          Element.isElement(n) &&
          (n.type === 'bulleted-list' || n.type === 'numbered-list') &&
          n.children.length === 0,
      })
    );

    if (listMatch) {
      const [, listPath] = listMatch;
      Transforms.removeNodes(editor, { at: listPath });
    }
  }, 0);

  return false; // Let default deletion behavior continue
};
