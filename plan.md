# Notes App Implementation Plan

## 🎯 Project Overview

Building a local-first note-taking application with rich text editing, organization features, and PWA capabilities. Designed to be extensible for future spaced repetition features.

## 🏗️ Tech Stack Foundation

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Rich Text**: SlateJS with slate-history
- **Icons**: Lucide React
- **Storage**: Dexie.js (IndexedDB) → Cloud Sync (Phase 4)
- **State**: Zustand (from Phase 1)
- **PWA**: Next.js PWA capabilities

## 📊 Core Data Models

```typescript
interface Note {
  id: string;
  title: string;
  content: SlateNode[];
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 Implementation Phases

### Phase 1: Foundation ✅ COMPLETED

**Goal**: Basic working note-taking app

#### Core Infrastructure

- [x] Next.js 14 project setup
- [x] Essential dependencies installed (including Dexie)
- [x] Development workflow setup (ESLint, TypeScript, git hooks)
- [x] Create core types and interfaces
- [x] Project structure and types
- [x] Basic layout with sidebar
- [x] Dexie database setup and persistence

#### Minimal Features

- [x] Create new notes
- [x] Edit notes (rich text with Slate.js)
- [x] Delete notes
- [x] List all notes
- [x] Auto-save functionality (real-time on every keystroke)

#### File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── editor/
│   │   └── SimpleEditor.tsx
│   └── notes/
│       ├── NotesList.tsx
│       └── NoteItem.tsx
├── hooks/
│   └── useDatabase.ts
├── store/
│   └── notesStore.ts
├── lib/
│   └── database.ts
├── types/
│   └── index.ts
└── utils/
    └── helpers.ts
```

### Phase 2: Enhanced Editing ✅ COMPLETED

**Goal**: Rich text editing with SlateJS

#### Rich Text Features

- [x] SlateJS editor implementation
- [x] Basic formatting (bold, italic, underline)
- [x] Headings (H1, H2, H3) with proper styling
- [x] Lists (bulleted and numbered)
- [x] Markdown shortcuts (# for headings, \* for lists, etc.)
- [x] Comprehensive toolbar with formatting options
- [x] Keyboard shortcuts (Ctrl/Cmd + B, I, U)
- [x] Clean, extensible architecture with separate utilities

#### Core Features

- [x] Local text search (title + content)
- [x] Sorted by last edited

### Phase 3: Polish & PWA

**Goal**: Production-ready app with offline capabilities

#### User Experience

- [ ] Dark/light theme toggle
- [ ] Responsive design
- [ ] Keyboard shortcuts

#### PWA Features

- [ ] Service worker setup
- [ ] Offline functionality
- [ ] Install prompts
- [ ] Background sync preparation

### Phase 4: Advanced Features

**Goal**: Advanced note-taking capabilities

#### Import/Export

- [ ] Markdown import/export
- [ ] JSON backup/restore
- [ ] Note sharing capabilities

### Phase 5: Advanced State Features

**Goal**: Advanced state management features and performance optimization

#### Advanced State Features

- [ ] Optimistic updates
- [ ] Undo/redo functionality
- [ ] State persistence middleware
- [ ] Performance optimization

#### Advanced Storage Features

- [ ] Full-text search indexing
- [ ] Query optimization
- [ ] Bulk operations

### Phase 6: Cloud Preparation

**Goal**: Foundation for future cloud sync

#### Sync Architecture

- [ ] API layer design
- [ ] Conflict resolution strategy
- [ ] Offline-first sync logic
- [ ] Event sourcing preparation

## 🎯 Immediate Goals

### Project Structure

- [x] Set up development workflow (linting, type-checking, git hooks)
- [x] Create core types and interfaces
- [x] Set up Dexie database class
- [x] Set up basic layout components
- [x] Set up Zustand store with async operations

### Basic CRUD ✅ COMPLETED

- [x] Note creation functionality
- [x] Rich text editor (SlateJS with structured content)
- [x] Note listing component with real-time preview
- [x] Delete functionality

### Core Features

- [x] Auto-save implementation (real-time on every keystroke)
- [ ] **NEXT: Basic local text search** ← We are here
- [ ] Polish and testing

## 🤖 AI Development Workflow

### Node.js Version Management

- **Required version**: Node.js 20+ for Next.js compatibility
- **Check version**: Use `node --version` to confirm correct version is active

### Quality Assurance Protocol

- **Before each commit**: Run `npm run check-all` to verify all quality checks pass
- **Ask before committing**: Always confirm with user before running `git commit`
- **Check off completed tasks**: Update plan.md checkboxes as features are completed
- **Test immediately**: Run relevant tests after implementing new features
- **Write comprehensive tests**: Every new feature should have corresponding tests
- **Minimal mocking**: Use mocks sparingly and only when absolutely necessary
- **Fix, don't mock**: When tests fail, fix the underlying issue rather than mocking it away
- **Never use `any`**: Always use proper TypeScript types - create specific interfaces, union types, or use generics instead of `any`

### Commit Guidelines

- **Small, focused commits**: Each commit should represent one logical change
- **Descriptive messages**: Clear commit messages describing what was implemented
- **Quality gates**: Pre-commit hooks automatically run linting, formatting, and tests
- **User confirmation**: Ask "Ready to commit these changes?" before proceeding

### Progress Tracking

- **Update checkboxes**: Mark completed items as [x] in plan.md
- **Document decisions**: Update technical decisions section when architecture changes
- **Note blockers**: Clearly communicate any issues or dependencies

### Testing Guidelines

- **Test-driven approach**: Write tests for all new functionality
- **Test BEHAVIOR, not INTERFACE**: Tests must verify actual functionality, not just function signatures
  - ❌ BAD: `expect(result).toBe(true)` (tests return value)
  - ✅ GOOD: `expect(editor.children[0].type).toBe('bulleted-list')` (tests actual transformation)
  - ❌ BAD: `expect(mockFunction).toHaveBeenCalled()` without verifying side effects
  - ✅ GOOD: Verify the actual state changes, DOM updates, or data transformations
- **Real integration tests**: Test actual database operations, not mocked versions
- **Fix configuration issues**: When tests fail due to setup/config, fix the root cause
- **Avoid mock solutions**: Mocks should be used only for external services, not internal logic
- **Test edge cases**: Include error handling, boundary conditions, and failure scenarios
- **Maintain test coverage**: Ensure all critical paths are tested
- **Failing tests first**: When implementing new features, write a failing test that verifies the expected behavior before implementing

### Development Cycle

1. **Write failing test**: Create a test that verifies the expected behavior (should fail initially)
2. **Implement feature**: Write code following our established patterns to make the test pass
3. **Verify behavior**: Ensure tests check actual functionality, not just interfaces
4. **Run quality checks**: `npm run check-all` to verify everything works
5. **Update plan**: Check off completed items in plan.md
6. **Ask user**: "Ready to commit [description of changes]?"
7. **Commit**: Only after user approval

## 🔧 Development Workflow & Quality

### Automated Quality Checks

- **ESLint**: Run on every file change to catch style/logic issues
- **TypeScript**: Continuous type checking for type safety
- **Tests**: Run relevant tests on code changes
- **Pre-commit hooks**: Prevent committing broken code

### Development Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "check-all": "npm run type-check && npm run lint && npm run test"
  }
}
```

### Git Hooks Setup

- **Pre-commit**: Run linting and type checks on staged files
- **Pre-push**: Run full test suite
- **Tools**: Husky + lint-staged for automated workflow

### IDE Integration

- **VS Code settings**: Auto-fix on save, format on save
- **Extensions**: ESLint, TypeScript, Prettier
- **Real-time feedback**: Immediate error highlighting

## 🔄 Development Principles

### Extensibility Focus

- Keep components modular and reusable
- Design data structures for future features
- Use composition over inheritance
- Plan for offline-first architecture

### Performance Considerations

- Lazy load components where possible
- Debounce search and auto-save
- Optimize re-renders with proper memoization
- Consider virtual scrolling for large note lists

### User Experience

- Immediate feedback for all actions
- Graceful error handling
- Intuitive keyboard shortcuts
- Responsive design from the start

## 🛠️ Technical Decisions

### Why This Tech Stack?

- **Next.js**: Future-proof, great PWA support, can add API routes later
- **SlateJS**: Most extensible rich text editor for React
- **Dexie.js**: Clean IndexedDB abstraction from the start
- **Zustand**: Excellent performance with selective subscriptions, built-in async support

### Future Extensibility Points

- Plugin architecture for editor features
- Modular storage adapters (local, cloud, sync)
- Component composition for different note types
- Event-driven architecture for feature additions

## 📈 Success Metrics

- [x] Can create and edit notes reliably
- [x] App works completely offline
- [ ] Fast search across all notes
- [x] Intuitive user interface
- [ ] Ready for cloud sync integration

---

**Next Step**: Begin Phase 1 implementation starting with project structure and types.
