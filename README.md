# Notes App

A modern, local-first note-taking application with rich text editing capabilities. Built with Next.js and SlateJS, designed for offline-first usage with extensible architecture for future features.

## ✨ Features

### Current Features (Phase 1 & 2 Complete)

- **Rich Text Editing**: Full-featured editor powered by SlateJS
- **Real-time Auto-save**: Notes are saved automatically as you type
- **Offline-First**: All data stored locally using IndexedDB
- **Rich Formatting**: Bold, italic, underline, headings (H1-H3)
- **Smart Lists**: Bulleted and numbered lists with intelligent indentation
- **Markdown Shortcuts**: Type `#` for headings, `*` for lists, etc.
- **Keyboard Shortcuts**: Standard formatting shortcuts (Ctrl/Cmd+B, I, U)
- **Modern UI**: Clean, responsive interface built with Tailwind CSS

### Coming Soon

- **Search Functionality**: Full-text search across all notes
- **Dark/Light Theme**: Theme toggle for better user experience
- **PWA Support**: Install as a native app with offline capabilities
- **Import/Export**: Markdown and JSON backup/restore features

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Rich Text Editor**: SlateJS with slate-history
- **Local Storage**: Dexie.js (IndexedDB wrapper)
- **State Management**: Zustand
- **Icons**: Lucide React
- **Testing**: Jest with React Testing Library

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (managed with nvm)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd notes
   ```

2. **Use correct Node.js version**

   ```bash
   source ~/.nvm/nvm.sh && nvm use 20
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server

# Quality Assurance
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues automatically
npm run type-check  # Run TypeScript type checking
npm test            # Run test suite
npm run test:watch  # Run tests in watch mode
npm run check-all   # Run all quality checks (lint + type-check + test)
```

### Development Workflow

1. **Quality First**: Always run `npm run check-all` before committing
2. **Test-Driven**: Write tests for new features and verify actual behavior
3. **TypeScript Strict**: No `any` types - use proper interfaces and generics
4. **Git Hooks**: Pre-commit hooks ensure code quality
5. **Small Commits**: Focus on single logical changes per commit

### Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/
│   ├── editor/         # Rich text editor components
│   ├── layout/         # Layout components (sidebar, header)
│   └── notes/          # Note-related components
├── lib/
│   ├── editor/         # Editor utilities and logic
│   └── database.ts     # Dexie database configuration
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
└── __tests__/          # Test files
```

## 📚 Documentation

- **[Project Plan](plan.md)**: Complete development roadmap, phases, and goals
- **[Editor Documentation](src/lib/editor/editor.md)**: Detailed rich text editor architecture and features

## 🔧 Architecture Highlights

### Local-First Design

- All data stored in IndexedDB for offline access
- Real-time auto-save with no server dependency
- Future-ready for cloud sync capabilities

### Rich Text Editor

- Custom SlateJS implementation with structured content
- Intelligent list system with indent-based hierarchy
- Comprehensive keyboard and markdown shortcuts
- Extensible plugin architecture

### State Management

- Zustand for lightweight, performant state management
- Async operations with optimistic updates
- Clean separation between UI state and data persistence

## 🎯 Current Status

**Phase 1 ✅ COMPLETED**: Foundation with basic CRUD operations  
**Phase 2 ✅ COMPLETED**: Rich text editing with SlateJS  
**Phase 3 ✅ COMPLETED**: Search functionality and UI polish  
**Phase 4 ✅ COMPLETED**: UI/UX enhancements and dark mode  
**Phase 5 ✅ COMPLETED**: Notecard functionality  
**Phase 6 ✅ COMPLETED**: Multi-user database schema migration  
**Phase 7 🚧 IN PROGRESS**: Deployment and hosting setup

See [plan.md](plan.md) for detailed phase breakdown and progress tracking.

## 🚀 Deployment

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database Configuration
DATABASE_URL=your_supabase_postgresql_url_here
DIRECT_URL=your_supabase_direct_url_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://teal.so
NODE_ENV=production
```

### Vercel Deployment

1. **Connect your repository** to Vercel
2. **Configure build settings** (auto-detected from `vercel.json`)
3. **Set environment variables** in Vercel dashboard
4. **Deploy** - automatic deployments on git push

### Supabase Setup

1. **Create new project** at [supabase.com](https://supabase.com)
2. **Run database migrations** to set up schema
3. **Configure Row Level Security** for multi-user support
4. **Update environment variables** with Supabase credentials

## 🤝 Contributing

1. Follow the established code patterns and architecture
2. Write tests for new features that verify actual behavior
3. Run `npm run check-all` before submitting changes
4. Update documentation when adding new features
5. Keep commits small and focused

## 📄 License

This project is for personal use and learning purposes.

---

_A modern note-taking app designed for creators who value speed, reliability, and extensibility._
