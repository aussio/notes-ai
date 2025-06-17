# Notes AI - Implementation Plan

## 🎯 Current Status

**Production App**: [teal.so](https://teal.so) - Fully deployed with authentication and offline-first architecture

### ✅ Solid Foundation Complete

- Rich text editor with SlateJS (formatting, markdown shortcuts, keyboard shortcuts)
- Notecard system with inline editing and embeds
- User authentication and multi-user data isolation
- Offline-first architecture with background cloud sync
- PWA capabilities and responsive design

## 🚀 Next Implementation Goals

### Phase 1: Spaced Repetition & Review System

**Goal**: Transform notecards into an effective spaced repetition learning system

#### 1.1 Spaced Repetition Algorithm

- [ ] Implement SM-2 algorithm for optimal review scheduling, except only correct/wrong
- [ ] Add review difficulty ratings (Correct, Wrong)
- [ ] Calculate next review dates based on performance
- [ ] Track learning statistics (retention rate, streak, etc.)

#### 1.2 Review Interface

- [ ] Create dedicated review session page
- [ ] Implement card presentation flow (front → back → rating)
- [ ] Add keyboard shortcuts for quick reviews (1/a/space/left for wrong, 0/delete/return/right for correct)
- [ ] Add dragging/swiping card to the left for wrong, to the right for correct. Intended for mobile touchscreen.
- [ ] Show progress during review sessions
- [ ] Add daily review statistics and streaks

#### 1.3 Review Scheduling & Analytics

- [ ] Daily review queue based on due dates
- [ ] Review calendar showing upcoming and overdue cards
- [ ] Learning analytics dashboard (retention curves, difficulty distribution)
- [ ] Review session history and statistics

#### 1.4 Enhanced Notecard Management

- [ ] Card difficulty and mastery indicators
- [ ] Bulk actions (suspend, reset progress, bulk edit)
- [ ] Notecard categories/tags for organization

#### Data Model Extensions

```typescript
// Keep notecard table clean - content only
interface Notecard {
  id: string;
  front: string;
  back: string;
  user_id: string;
  tags: string[]; // Categories/organization
  suspended: boolean; // Temporarily disable card
  createdAt: Date;
  updatedAt: Date;
}

// Separate table for review performance data
interface NotecardReviewStats {
  id: string;
  notecard_id: string; // Foreign key to notecards table
  user_id: string; // For data isolation
  easinessFactor: number; // SM-2 ease factor
  intervalDays: number; // Current interval
  repetitions: number; // Number of successful reviews
  nextReviewDate: Date; // When card is due
  lastReviewDate: Date | null; // Last review timestamp (null for new cards)
  totalReviews: number; // Total review count
  correctReviews: number; // Successful reviews
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewSession {
  id: string;
  user_id: string;
  startTime: Date;
  endTime: Date;
  cardsReviewed: number;
  cardsCorrect: number;
}
```

### Phase 2: Image Support System

**Goal**: Add comprehensive image support for both notes and notecards

#### 2.1 Image Upload & Storage

- [ ] Implement image upload with drag-and-drop
- [ ] Set up cloud storage (Supabase Storage or AWS S3)
- [ ] Add image compression and optimization
- [ ] Support multiple formats (PNG, JPG, WebP, GIF)
- [ ] Implement image resizing for different contexts

#### 2.2 Rich Text Image Integration

- [ ] Create custom Slate image element
- [ ] Add image toolbar button and insertion
- [ ] Implement image resizing within editor
- [ ] Add image alt text and caption support
- [ ] Handle image paste from clipboard

#### 2.3 Notecard Image Support

- [ ] Add image fields to notecard front/back
- [ ] Create image-focused notecard templates
- [ ] Optimize images for review interface
- [ ] Support mixed text + image content

#### 2.4 Image Management

- [ ] Image gallery/library for reuse
- [ ] Bulk image operations and cleanup
- [ ] Image search and tagging
- [ ] Offline image caching strategy

#### Data Model Extensions

```typescript
interface ImageAsset {
  id: string;
  user_id: string;
  filename: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  dimensions: { width: number; height: number };
  mimeType: string;
  createdAt: Date;
}

// Slate element for images
interface ImageElement {
  type: 'image';
  imageId: string;
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  children: [{ text: '' }];
}

// Enhanced notecard with image support
interface Notecard {
  // ... existing fields
  frontImages: string[]; // Array of image asset IDs
  backImages: string[]; // Array of image asset IDs
}
```

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
- Maintain offline-first architecture

### Performance Considerations

- Lazy load components where possible
- Debounce search and auto-save
- Optimize re-renders with proper memoization
- Consider virtual scrolling for large lists
- Optimize image loading and caching

### User Experience

- Immediate feedback for all actions
- Graceful error handling
- Intuitive keyboard shortcuts
- Responsive design from the start
- Progressive enhancement for advanced features

## 🛠️ Technical Decisions

### Current Architecture (Proven)

- **Next.js 14**: App router with TypeScript
- **SlateJS**: Extensible rich text editing
- **IndexedDB + Supabase**: Offline-first with cloud sync
- **Zustand**: Simple, performant state management
- **Tailwind CSS**: Utility-first styling

### New Technical Considerations

#### Spaced Repetition

- **Algorithm**: SM-2 for proven effectiveness
- **Storage**: Extend existing database schema
- **Scheduling**: Client-side calculation with cloud backup
- **Analytics**: Real-time learning statistics

#### Image Support

- **Storage**: Supabase Storage for cloud, IndexedDB for offline cache
- **Processing**: Client-side compression and resizing
- **Integration**: Custom Slate elements for seamless editing
- **Performance**: Progressive loading and optimization

## 📈 Success Metrics

### Phase 1 (Spaced Repetition)

- [ ] Users can review notecards with spaced repetition scheduling
- [ ] Review sessions show clear progress and statistics
- [ ] Algorithm effectively schedules cards based on difficulty
- [ ] Review interface is intuitive and keyboard-friendly

### Phase 2 (Image Support)

- [ ] Users can add images to notes and notecards seamlessly
- [ ] Images work offline and sync to cloud
- [ ] Image editing and management is intuitive
- [ ] Performance remains good with image content

---

**Next Step**: Begin Phase 1.1 - Implement SM-2 spaced repetition algorithm and extend notecard data model.
