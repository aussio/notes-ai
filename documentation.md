# Notes AI - Project Documentation

## 🎯 Project Overview

A local-first note-taking application with rich text editing, notecards, and PWA capabilities. Built with offline-first architecture and cloud sync.

**Live App**: [teal.so](https://teal.so)

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Rich Text**: SlateJS with slate-history
- **Icons**: Lucide React
- **Storage**: IndexedDB (Dexie.js) + Supabase (cloud sync)
- **State**: Zustand
- **Auth**: Supabase Auth
- **Deployment**: Vercel

## 📊 Core Data Models

```typescript
interface Note {
  id: string;
  title: string;
  content: SlateNode[];
  user_id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Notecard {
  id: string;
  front: string;
  back: string;
  user_id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Custom Slate element for embedding notecards
interface NotecardEmbedElement {
  type: 'notecard-embed';
  notecardId: string;
  children: [{ text: '' }];
}
```

## 🚀 Implementation Status

### ✅ Completed Phases

**Phase 1: Foundation**

- Next.js setup with Dexie database
- Basic CRUD operations for notes
- Rich text editing with auto-save

**Phase 2: Enhanced Editing**

- SlateJS rich text editor
- Formatting (bold, italic, underline, headings, lists)
- Markdown shortcuts and keyboard shortcuts
- Comprehensive toolbar

**Phase 3: Polish & PWA**

- Dark/light theme toggle
- Responsive design
- PWA capabilities and offline functionality

**Phase 5: Notecards System**

- Standalone notecard management
- Notecard embeds in notes with inline editing
- Real-time sync between embedded and standalone views
- Auto-cleanup of empty notecards

**Phase 6: User-Keyed Data**

- Database schema migration with user_id fields
- Multi-user data preparation

**Phase 7: Deployment**

- Supabase project setup with PostgreSQL
- Vercel deployment with custom domain
- Production environment configuration

**Phase 8: Authentication**

- Supabase Auth integration
- Email/password and OAuth authentication
- Protected routes and user profiles
- Multi-user data isolation

**Phase 9: Offline-First Architecture** ← **CURRENT**

- Simplified database layer (IndexedDB-first)
- Background sync service implementation
- Sync queue with retry logic
- Real-time sync status UI

### 🔄 Current Focus: Phase 9 Completion

**Remaining Tasks:**

- Conflict resolution system
- Advanced sync optimizations
- Full offline/online transition testing

### 📋 Upcoming Phases

**Phase 10: Advanced Features**

- Full-text search with PostgreSQL
- Advanced PWA features
- Performance optimizations
- Production polish

## 🏛️ Architecture

### Offline-First Design

```
User Action → Zustand Store → IndexedDB → Immediate UI Update
                    ↓
              Sync Queue → Background Sync → Supabase
```

**Key Benefits:**

- Always works offline (IndexedDB primary)
- Instant UI updates (no network waiting)
- Automatic background cloud sync
- Simple development workflow

### File Structure

```
src/
├── app/                    # Next.js app router pages
├── components/
│   ├── auth/              # Authentication components
│   ├── editor/            # Rich text editor components
│   ├── layout/            # App layout and navigation
│   ├── notecards/         # Notecard management
│   ├── notes/             # Note management
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/
│   ├── editor/            # SlateJS utilities and formatting
│   ├── sync/              # Background sync services
│   ├── database.ts        # IndexedDB operations
│   └── supabase.ts        # Cloud database client
├── store/                 # Zustand state management
└── types/                 # TypeScript type definitions
```

## 🔧 Development Workflow

### Quality Assurance

```bash
npm run check-all  # Run all quality checks
npm run dev        # Start development server
npm run test       # Run test suite
```

### Pre-commit Checks

- ESLint (style and logic)
- TypeScript type checking
- Jest test suite
- Prettier formatting

### Testing Strategy

- Integration tests for database operations
- Component testing for UI interactions
- Editor behavior testing for rich text features
- Sync service testing for offline/online scenarios

## 🛠️ Key Technical Decisions

### Database Strategy

- **Local-first**: IndexedDB as primary data store
- **Background sync**: Non-blocking cloud synchronization
- **User isolation**: All data scoped by user_id
- **Conflict resolution**: Last-write-wins with manual resolution for complex cases

### Editor Architecture

- **SlateJS**: Extensible rich text editing
- **Modular utilities**: Separate concerns (formatting, shortcuts, serialization)
- **Custom elements**: Notecard embeds as first-class Slate elements
- **Real-time**: Auto-save on every keystroke

### State Management

- **Zustand**: Simple, performant state management
- **Local operations**: All store actions work with IndexedDB
- **Sync service**: Separate background synchronization
- **Optimistic updates**: Immediate UI feedback

## 🔍 Core Features

### Notes

- Rich text editing with SlateJS
- Auto-save functionality
- Search across title and content
- Markdown shortcuts (# for headings, \* for lists)
- Keyboard shortcuts (Ctrl/Cmd + B, I, U)

### Notecards

- Standalone notecard management
- Embed notecards directly in notes
- Inline editing within note context
- Auto-cleanup of empty notecards
- Tab navigation between front/back

### Sync & Offline

- Works completely offline
- Background cloud synchronization
- Sync status indicators
- Network status awareness
- Automatic retry with exponential backoff

### User Experience

- Dark/light theme toggle
- Responsive design for all devices
- PWA installation prompts
- Intuitive keyboard navigation
- Real-time UI updates

## 🚦 Current Status

**Production Ready**: ✅ Deployed at [teal.so](https://teal.so)  
**Authentication**: ✅ Full user auth system  
**Offline Support**: ✅ Complete offline functionality  
**Cloud Sync**: 🔄 Background sync implemented, conflict resolution in progress  
**Multi-user**: ✅ Full user data isolation

---

_Last updated: Phase 9 - Offline-First Architecture_
