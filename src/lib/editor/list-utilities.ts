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

export const handleEnterKeyPress = (
  editor: CustomEditor,
  event: React.KeyboardEvent
) => {
  const { selection } = editor;
  if (!selection) return false;

  // Get the current block element
  const [currentBlock] = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: (n) =>
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        (n.type === 'heading' || n.type === 'list-item'),
      mode: 'lowest',
    })
  );

  if (!currentBlock) return false;

  const [blockNode, blockPath] = currentBlock;
  const customElement = blockNode as CustomElement;

  // Scenario 1: Handle Enter on heading elements
  if (customElement.type === 'heading') {
    event.preventDefault();

    // Check if cursor is at the beginning of the heading
    const isAtStart =
      selection.anchor.offset === 0 && selection.focus.offset === 0;

    const newParagraph = {
      type: 'paragraph' as const,
      children: [{ text: '' }],
    };

    if (isAtStart) {
      // Insert paragraph before the heading and move heading down
      Transforms.insertNodes(editor, newParagraph, {
        at: [blockPath[0]],
      });

      // Move cursor to the new paragraph above
      Transforms.select(editor, [blockPath[0], 0]);
    } else {
      // Insert paragraph after the heading (existing behavior)
      Transforms.insertNodes(editor, newParagraph, {
        at: [blockPath[0] + 1],
      });

      // Move cursor to the new paragraph
      Transforms.select(editor, [blockPath[0] + 1, 0]);
    }

    return true;
  }

  // Scenario 2: Handle Enter on empty list items
  if (customElement.type === 'list-item') {
    // Check if the list item is empty (only contains empty text)
    const isEmpty = customElement.children.every(
      (child) => child.text === '' || (child.text && child.text.trim() === '')
    );

    if (isEmpty) {
      event.preventDefault();

      // Get the parent list container
      const [parentList, parentListPath] = Editor.parent(editor, blockPath);

      if (
        !Element.isElement(parentList) ||
        (parentList.type !== 'bulleted-list' &&
          parentList.type !== 'numbered-list')
      ) {
        return false;
      }

      const wasOnlyItem = parentList.children.length === 1;

      // Convert the empty list item to a paragraph
      const newParagraph = {
        type: 'paragraph' as const,
        children: [{ text: '' }],
      };

      // Remove the empty list item
      Transforms.removeNodes(editor, { at: blockPath });

      // Insert the new paragraph after the list
      Transforms.insertNodes(editor, newParagraph, {
        at: [parentListPath[0] + 1],
      });

      // If this was the only item in the list, remove the now-empty list container
      if (wasOnlyItem) {
        Transforms.removeNodes(editor, {
          at: parentListPath,
        });

        // Select the paragraph (adjust path since list was removed)
        Transforms.select(editor, [parentListPath[0], 0]);
      } else {
        // Select the new paragraph after the list
        Transforms.select(editor, [parentListPath[0] + 1, 0]);
      }

      return true;
    }
  }

  return false; // Let default Enter behavior handle other cases
};
