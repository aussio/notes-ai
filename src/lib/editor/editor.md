# Rich Text Editor Documentation

## Overview

This rich text editor is built using Slate.js and provides a clean, modern interface for creating and editing rich text content. The editor supports multiple text formatting options, hierarchical lists, and various keyboard shortcuts.

## Core Architecture

### Editor Stack

- **Slate.js**: Core editor framework providing the editing primitives
- **slate-react**: React integration for Slate
- **slate-history**: Undo/redo functionality
- **Custom plugins**: Our own extensions for specialized behavior

### Data Structure

The editor uses a hierarchical node structure where each document is composed of `CustomElement[]`:

```typescript
// Text container elements
interface TextElement {
  type: 'paragraph' | 'heading' | 'list-item';
  children: CustomText[];
  level?: 1 | 2 | 3; // For headings
  indent?: number; // For list item indentation
}

// List container elements
interface ListElement {
  type: 'bulleted-list' | 'numbered-list';
  children: TextElement[]; // Contains list-item elements
}
```

## List System

### Indentation Logic

Our list system uses **indent levels** rather than nested list structures for better UX and simpler data management:

#### Traditional Nested Lists (❌ We don't use this)

```html
<ul>
  <li>Item 1</li>
  <li>
    Item 2
    <ul>
      <li>Sub-item 1</li>
      <li>Sub-item 2</li>
    </ul>
  </li>
</ul>
```

#### Our Indent-Based System (✅ What we use)

```html
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li style="margin-left: 1.5rem">Sub-item 1</li>
  <li style="margin-left: 1.5rem">Sub-item 2</li>
</ul>
```

**Data Structure Example:**

```json
{
  "type": "bulleted-list",
  "children": [
    { "type": "list-item", "children": [{ "text": "Item 1" }] },
    { "type": "list-item", "children": [{ "text": "Item 2" }] },
    {
      "type": "list-item",
      "children": [{ "text": "Sub-item 1" }],
      "indent": 1
    },
    { "type": "list-item", "children": [{ "text": "Sub-item 2" }], "indent": 1 }
  ]
}
```

### Indentation Rules

1. **First Item Restriction**: The first item in any list cannot be indented (maintains list hierarchy)
2. **Increment by 1**: Each Tab press increases indent by 1 level
3. **Visual Spacing**: Each indent level adds 1.5rem of left margin
4. **Outdent Behavior**:
   - Indented items (indent > 0): Reduce indent by 1
   - Top-level items (indent = 0): Convert to paragraph and move outside list

### Keyboard Shortcuts

| Shortcut     | Action            | Behavior                                        |
| ------------ | ----------------- | ----------------------------------------------- |
| `Tab`        | Indent list item  | Increases indent level (except first item)      |
| `Shift+Tab`  | Outdent list item | Decreases indent or converts to paragraph       |
| `Backspace`  | Delete + cleanup  | Normal deletion + removes empty list containers |
| `Delete`     | Delete + cleanup  | Normal deletion + removes empty list containers |
| `Ctrl/Cmd+B` | Bold toggle       | Toggles bold formatting                         |
| `Ctrl/Cmd+I` | Italic toggle     | Toggles italic formatting                       |
| `Ctrl/Cmd+U` | Underline toggle  | Toggles underline formatting                    |

### Markdown Shortcuts

| Pattern | Result        | Trigger             |
| ------- | ------------- | ------------------- |
| `# `    | Heading 1     | Space after #       |
| `## `   | Heading 2     | Space after ##      |
| `### `  | Heading 3     | Space after ###     |
| `* `    | Bulleted list | Space after \*      |
| `- `    | Bulleted list | Space after -       |
| `1. `   | Numbered list | Space after number. |

## Complex Behaviors

### List Item Outdenting

When a user presses `Shift+Tab` on a top-level list item, the system:

1. **Converts** the list-item to a paragraph
2. **Moves** the paragraph outside the list container (maintains valid HTML)
3. **Removes** the list container if it becomes empty
4. **Preserves** cursor position in the new paragraph

This ensures we never have invalid HTML like `<p>` inside `<ul>`.

### List Deletion Cleanup

When a user deletes content with `Backspace` or `Delete` keys, the system:

1. **Allows normal deletion** to proceed
2. **Checks for empty list containers** after deletion
3. **Removes empty `<ul>` or `<ol>` elements** automatically
4. **Maintains clean document structure** without orphaned containers

This prevents scenarios where deleting all list items would leave behind empty list containers in the DOM.

### Markdown Transformation

Markdown shortcuts are triggered on `Space` keypress and work by:

1. **Analyzing** the text before the cursor
2. **Matching** against regex patterns
3. **Deleting** the markdown syntax
4. **Transforming** the element type
5. **Preserving** the text content

### Editor State Management

The editor maintains state through:

- **Slate's internal state**: Selection, history, node tree
- **React state**: Current value passed to parent components
- **Forced re-renders**: Using `editorKey` prop to recreate editor instances

## File Structure

```
src/lib/editor/
├── index.ts                 # Main exports
├── block-formatting.ts      # Block-level formatting (headings, lists)
├── text-formatting.ts       # Inline formatting (bold, italic, underline)
├── list-utilities.ts        # List-specific operations
├── keyboard-shortcuts.ts    # Keyboard event handling
├── markdown-shortcuts.ts    # Markdown syntax processing
└── editor.md               # This documentation file
```

## Testing Strategy

Our editor tests cover:

- **Unit tests**: Individual utility functions
- **Integration tests**: Keyboard shortcut behaviors
- **Edge cases**: Empty states, boundary conditions
- **Regression tests**: Previously fixed bugs

## Debugging Tips

### Common Issues

1. **Selection Problems**: Check if `editor.selection` exists before operations
2. **Invalid Transforms**: Ensure paths are valid before applying transforms
3. **React Re-renders**: Use `editorKey` to force fresh editor instances
4. **Type Mismatches**: Verify element types match expected CustomElement interfaces

### Debug Helpers

```typescript
// Log current selection
console.log('Selection:', editor.selection);

// Log editor content
console.log('Content:', editor.children);

// Check if in list
console.log('In list:', isInList(editor));
```

---

_This documentation should be updated as the editor evolves to maintain accuracy for both human developers and AI assistants._
