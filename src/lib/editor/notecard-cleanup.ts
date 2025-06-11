import type {
  CustomElement,
  NotecardEmbedElement,
  Note,
  ListElement,
  TextElement,
} from '@/types';

/**
 * Remove all notecard embeds with the specified notecard ID from editor content
 */
export const removeNotecardEmbedsFromContent = (
  content: CustomElement[],
  notecardId: string
): CustomElement[] => {
  const removeEmbeds = (nodes: CustomElement[]): CustomElement[] => {
    return nodes
      .filter((node) => {
        // Remove notecard embeds that match the deleted notecard ID
        if (node.type === 'notecard-embed') {
          const embedNode = node as NotecardEmbedElement;
          return embedNode.notecardId !== notecardId;
        }
        return true;
      })
      .map((node) => {
        // Handle list elements with nested TextElement children
        if (node.type === 'bulleted-list' || node.type === 'numbered-list') {
          const listNode = node as ListElement;
          return {
            ...listNode,
            children: removeEmbeds(listNode.children) as TextElement[],
          };
        }

        // Other elements don't have CustomElement children, so return as-is
        return node;
      });
  };

  return removeEmbeds(content);
};

/**
 * Count how many notecard embeds reference a specific notecard ID
 */
export const countNotecardEmbeds = (
  content: CustomElement[],
  notecardId: string
): number => {
  let count = 0;

  const countInNodes = (nodes: CustomElement[]) => {
    for (const node of nodes) {
      if (node.type === 'notecard-embed') {
        const embedNode = node as NotecardEmbedElement;
        if (embedNode.notecardId === notecardId) {
          count++;
        }
      } else if (
        node.type === 'bulleted-list' ||
        node.type === 'numbered-list'
      ) {
        // Recursively count in list children
        const listNode = node as ListElement;
        countInNodes(listNode.children);
      }
      // TextElement children contain CustomText, not CustomElement, so no recursion needed
    }
  };

  countInNodes(content);
  return count;
};

/**
 * Find all notes that contain embeds for a specific notecard
 */
export const findNotesWithNotecardEmbeds = (
  notes: Note[],
  notecardId: string
): Note[] => {
  return notes.filter((note) => {
    return countNotecardEmbeds(note.content, notecardId) > 0;
  });
};
