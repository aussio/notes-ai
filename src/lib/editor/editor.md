# Rich Text Editor Documentation

## Overview

This rich text editor is built using Slate.js and provides a clean, modern interface for creating and editing rich text content. The editor supports multiple text formatting options, hierarchical lists, markdown shortcuts, and embedded notecard functionality with spaced repetition capabilities.

## Core Architecture

### Editor Stack

- **Slate.js**: Core editor framework providing the editing primitives
- **slate-react**: React integration for Slate
- **slate-history**: Undo/redo functionality
- **Custom plugins**: Our own extensions for specialized behavior including void elements

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

// Void elements (non-editable blocks)
interface NotecardEmbedElement {
  type: 'notecard-embed';
  notecardId: string;
  children: [{ text: '' }]; // Required by Slate even for void elements
}
```

## Notecard Embed System

### Void Elements Concept

Notecard embeds are implemented as **void elements** in Slate, which means:

- **Non-editable**: Users cannot place cursor inside the element or type text directly
- **Self-contained**: The element renders its own internal UI but doesn't expose editable children
- **Block-level**: Behaves as an atomic block that can be selected as a whole but not edited directly

### Void Element Configuration

```typescript
const withCustomElements = (editor: CustomEditor) => {
  const { isVoid } = editor;

  editor.isVoid = (element) => {
    return element.type === 'notecard-embed' ? true : isVoid(element);
  };

  return editor;
};
```

### Notecard Embed Structure

Each notecard embed contains:

```typescript
interface NotecardEmbedElement {
  type: 'notecard-embed';
  notecardId: string; // References standalone notecard
  children: [{ text: '' }]; // Required by Slate infrastructure
}
```

### Inline Editing System

Notecard embeds support sophisticated inline editing without modals:

#### Visual Design

- **Table-like layout**: Two-row structure (front/back separated by border)
- **Direct editing**: Click any field to edit in place
- **Auto-sizing**: Textareas grow with content automatically
- **Visual feedback**: Hover effects and clear editing states

#### Editing Behavior

- **Auto-save**: Saves immediately on blur (no debounce)
- **Escape to cancel**: Reverts unsaved changes
- **Smart auto-focus**: Only newly created notecards auto-focus (time-based detection)
- **Real-time sync**: Changes appear instantly in all embedded instances
- **Auto-cleanup**: Empty notecards are automatically deleted when abandoned

### Smart Auto-Focus System

The system intelligently determines when to auto-focus notecard fields:

```typescript
// Only auto-focus recently created empty notecards
const now = Date.now();
const createdAt = new Date(notecard.createdAt).getTime();
const isRecentlyCreated = now - createdAt < 2000; // 2 seconds window

if (isRecentlyCreated && !notecard.front && !notecard.back) {
  setShouldAutoFocus(true);
}
```

**Benefits**:

- ✅ **New notecards**: Auto-focus for immediate editing
- ✅ **Loading existing notes**: No focus stealing from stored empty notecards
- ✅ **Navigation**: Smooth switching between notes with empty notecards

### Tab Navigation Flow

Sophisticated keyboard navigation for seamless note-taking:

```
Create Notecard → Auto-focus Front → Tab → Back → Tab → Exit & Continue Writing
```

#### Navigation Rules

1. **Front → Back**: Tab moves from front field to back field
2. **Back → Front**: Shift+Tab moves from back field to front field
3. **Back → Exit**: Tab from back field exits notecard and moves cursor below
4. **Smart positioning**: Creates new paragraph if none exists after notecard

#### Focus Management Fix

The system prevents conflicts between blur events and tab navigation:

```typescript
// Track navigation state to prevent blur interference
const [isNavigating, setIsNavigating] = useState(false);

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    setIsNavigating(true); // Prevent blur handler from interfering

    if (e.shiftKey && onTabPrevious) {
      handleSave().then(() => onTabPrevious());
    } else if (!e.shiftKey && onTabNext) {
      handleSave().then(() => onTabNext());
    } else if (!e.shiftKey && onTabExit) {
      handleSave().then(() => onTabExit());
    }

    setTimeout(() => setIsNavigating(false), 100);
  }
};

const handleBlur = () => {
  // Only save on blur if we're not navigating via Tab
  if (!isNavigating) {
    handleSave();
  }
};
```

#### Exit Notecard Logic

```typescript
const handleExitNotecard = () => {
  try {
    // Find path of current notecard
    const notecardPath = ReactEditor.findPath(editor, element);
    const nextPath = Path.next(notecardPath);

    if (Editor.hasPath(editor, nextPath)) {
      // Move to existing next element's first text node
      Transforms.select(editor, { path: [...nextPath, 0], offset: 0 });
    } else {
      // Create new paragraph and move cursor there
      const newParagraph = {
        type: 'paragraph' as const,
        children: [{ text: '' }],
      };
      Transforms.insertNodes(editor, newParagraph, {
        at: Path.next(notecardPath),
      });
      Transforms.select(editor, {
        path: [...Path.next(notecardPath), 0],
        offset: 0,
      });
    }

    // Delayed focus to ensure DOM is ready
    setTimeout(() => {
      ReactEditor.focus(editor);
    }, 50);
  } catch (error) {
    console.error('Failed to exit notecard:', error);

    // Fallback focus attempt
    try {
      ReactEditor.focus(editor);
    } catch (focusError) {
      console.error('Failed to focus editor as fallback:', focusError);
    }
  }
};
```

### Smart Insertion Logic

The insertion system intelligently handles different scenarios:

```typescript
export const insertNotecardEmbed = (
  editor: CustomEditor,
  notecardId: string
): void => {
  const { selection } = editor;
  if (!selection) return;

  const notecardEmbed: NotecardEmbedElement = {
    type: 'notecard-embed',
    notecardId,
    children: [{ text: '' }],
  };

  // Check if we're in an empty paragraph that we should replace
  const [match] = Editor.nodes(editor, {
    match: (n) => Element.isElement(n) && n.type === 'paragraph',
  });

  const isInEmptyParagraph =
    match && Element.isElement(match[0]) && Editor.isEmpty(editor, match[0]);

  // If text is selected, delete it first
  if (!Range.isCollapsed(selection)) {
    Transforms.delete(editor);
  }

  if (isInEmptyParagraph) {
    // Delete the empty paragraph and insert the notecard
    Transforms.delete(editor);
    Transforms.insertNodes(editor, notecardEmbed);
  } else {
    // Insert the notecard embed normally
    Transforms.insertNodes(editor, notecardEmbed);
  }
};
```

**Smart Behaviors**:

- ✅ **Empty line**: Replaces empty paragraph with notecard
- ✅ **Text selection**: Replaces selected text with notecard
- ✅ **Normal insertion**: Inserts at cursor position
- ✅ **Clean structure**: No unnecessary empty paragraphs

### Auto-Cleanup System

Empty notecards are automatically deleted to prevent library clutter:

```typescript
// Track editing state across both fields
const [isEditing, setIsEditing] = useState(false);

// Auto-delete empty notecards when user stops editing
useEffect(() => {
  if (notecard && !isEditing && !notecard.front && !notecard.back) {
    // Notecard is empty and user has stopped editing - delete it
    const cleanup = setTimeout(() => {
      deleteNotecard(notecard.id);
    }, 1000); // 1 second grace period

    return () => clearTimeout(cleanup);
  }
}, [notecard, isEditing, deleteNotecard]);

// Track editing across field interactions
const handleFieldEditStart = () => setIsEditing(true);
const handleFieldEditEnd = () => setIsEditing(false);
```

**Cleanup Rules**:

- ✅ **Grace period**: 1-second delay prevents accidental deletion
- ✅ **Content protection**: Any content in either field prevents deletion
- ✅ **Editing immunity**: Active editing prevents deletion
- ✅ **Cascade cleanup**: Uses existing deletion system to clean embeds from notes

### Real-time Synchronization

#### Reactive State Management

- **Zustand selectors**: `useNotecardById(id)` provides reactive updates
- **Bi-directional sync**: Changes in standalone editor appear in all embeds
- **Performance optimized**: Uses `subscribeWithSelector` middleware

#### State Updates

```typescript
// Embedded notecards automatically update when original changes
const notecard = useNotecardById(element.notecardId);

// Real-time updates without manual refresh
useEffect(() => {
  // Notecard content updates reactively
}, [notecard?.front, notecard?.back]);
```

### Cascade Deletion System

#### Orphaned Embed Cleanup

When a notecard is deleted, the system automatically:

1. **Finds affected notes**: Scans all notes for embeds referencing the deleted notecard
2. **Removes orphaned embeds**: Cleans embed elements from note content
3. **Updates database**: Persists cleaned content to storage
4. **Syncs memory stores**: Updates both notes and notecards stores in real-time

#### Cross-Store Communication

```typescript
// Notecards store notifies notes store of updates
const affectedNoteIds: string[] = [];
for (const note of notesWithEmbeds) {
  const updatedContent = removeNotecardEmbedsFromContent(note.content, id);
  await notesDatabase.updateNote(note.id, { content: updatedContent });
  affectedNoteIds.push(note.id);
}

// Notify notes store to refresh affected notes from database
if (notifyNotesStoreUpdate && affectedNoteIds.length > 0) {
  notifyNotesStoreUpdate(affectedNoteIds);
}
```

### Toolbar Integration

#### One-Click Creation

- **Direct creation**: Toolbar button creates new notecard and inserts embed immediately
- **Auto-focus**: Newly created notecards automatically focus the front field
- **Loading states**: Prevents double-clicks during creation
- **Error handling**: Graceful fallback if creation fails

#### Insertion Logic

```typescript
const handleCreateNotecard = async () => {
  const newNotecard = await createNotecard('', '');
  insertNotecardEmbed(editor, newNotecard.id);
  // Auto-focus happens in NotecardEmbed component
};
```

### Data Loading Strategy

#### Lazy Loading with Auto-initialization

```typescript
// Load notecards automatically when embedded notecards are encountered
useEffect(() => {
  if (notecards.length === 0) {
    loadNotecards();
  }
}, [notecards.length, loadNotecards]);
```

This ensures:

- **Notes page**: Notecards load on-demand when embeds are rendered
- **Notecards page**: Notecards load explicitly when page is visited
- **No duplicate loading**: Smart checks prevent unnecessary requests

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

### Notecard-Specific Shortcuts

| Context     | Shortcut               | Action                          |
| ----------- | ---------------------- | ------------------------------- |
| Front field | `Tab`                  | Move to back field              |
| Back field  | `Tab`                  | Exit notecard, continue writing |
| Back field  | `Shift+Tab`            | Move to front field             |
| Any field   | `Escape`               | Cancel edit, revert changes     |
| Toolbar     | Click credit card icon | Create new notecard             |

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

### Notecard State Synchronization

#### Cross-Store Updates

When notecard operations affect notes, the system:

1. **Updates database**: Persists changes to IndexedDB
2. **Notifies affected stores**: Uses callback system for real-time sync
3. **Refreshes memory state**: Reloads specific notes from database
4. **Updates UI immediately**: No manual refresh required

#### Store Communication Pattern

```typescript
// Notecards store → Notes store communication
setNotesStoreUpdateCallback((affectedNoteIds: string[]) => {
  store.refreshNotes(affectedNoteIds);
});
```

### Editor State Management

The editor maintains state through:

- **Slate's internal state**: Selection, history, node tree
- **React state**: Current value passed to parent components
- **Forced re-renders**: Using `editorKey` prop to recreate editor instances
- **Cross-component sync**: Zustand stores with reactive selectors

## File Structure

```
src/lib/editor/
├── index.ts                 # Main exports
├── block-formatting.ts      # Block-level formatting (headings, lists)
├── text-formatting.ts       # Inline formatting (bold, italic, underline)
├── list-utilities.ts        # List-specific operations
├── keyboard-shortcuts.ts    # Keyboard event handling
├── markdown-shortcuts.ts    # Markdown syntax processing
├── notecard-utilities.ts    # Notecard embed operations
├── notecard-cleanup.ts      # Cascade deletion utilities
└── editor.md               # This documentation file

src/components/notecards/
├── NotecardEmbed.tsx        # Void element renderer with inline editing
├── NotecardField.tsx        # Reusable field component
├── NotecardEditor.tsx       # Standalone notecard editor
└── NotecardsList.tsx        # Notecard management interface
```

## Testing Strategy

Our editor tests cover:

- **Unit tests**: Individual utility functions
- **Integration tests**: Keyboard shortcut behaviors
- **Edge cases**: Empty states, boundary conditions
- **Regression tests**: Previously fixed bugs
- **Void element behavior**: Notecard embed insertion and navigation
- **Cross-store synchronization**: State updates across components

## Debugging Tips

### Common Issues

1. **Selection Problems**: Check if `editor.selection` exists before operations
2. **Invalid Transforms**: Ensure paths are valid before applying transforms
3. **React Re-renders**: Use `editorKey` to force fresh editor instances
4. **Type Mismatches**: Verify element types match expected CustomElement interfaces
5. **Void Element Errors**: Ensure void elements have required `children` property
6. **Store Sync Issues**: Verify callback registration happens on client-side only

### Debug Helpers

```typescript
// Log current selection
console.log('Selection:', editor.selection);

// Log editor content
console.log('Content:', editor.children);

// Check if in list
console.log('In list:', isInList(editor));

// Check void element configuration
console.log('Is void:', editor.isVoid(element));

// Debug notecard state
console.log('Notecard:', useNotecardById(notecardId));
```

### Notecard-Specific Debugging

```typescript
// Check notecard embed structure
console.log('Notecard embed:', getCurrentNotecardEmbed(editor));

// Verify store synchronization
console.log('Notes store:', useNotesStore.getState());
console.log('Notecards store:', useNotecardsStore.getState());

// Test cascade deletion
console.log(
  'Notes with embeds:',
  findNotesWithNotecardEmbeds(notes, notecardId)
);
```

## Performance Considerations

### Notecard Optimization

- **Reactive selectors**: Use `useNotecardById` for granular updates
- **Debounced auto-save**: 500ms delay prevents excessive database writes
- **Lazy loading**: Notecards load only when needed
- **Memoized components**: Prevent unnecessary re-renders

### Editor Performance

- **Void elements**: Reduce editing complexity by isolating interactive areas
- **Path-based operations**: Efficient cursor management using Slate paths
- **Selective subscriptions**: Zustand middleware prevents over-subscribing

---

_This documentation should be updated as the editor evolves to maintain accuracy for both human developers and AI assistants working on the notecard system._
