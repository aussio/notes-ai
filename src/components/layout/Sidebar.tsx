'use client';

import { Plus, Search, Menu } from 'lucide-react';
import { useNotesStore, useFilteredNotes } from '@/store/notesStore';
import { serializeToPlainText } from '@/lib/editor';
import type { CustomElement } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const {
    searchQuery,
    setSearchQuery,
    createNote,
    setCurrentNote,
    currentNote,
    isLoading,
    error,
  } = useNotesStore();
  const filteredNotes = useFilteredNotes();

  const handleNewNote = async () => {
    try {
      await createNote();
      // The new note is automatically set as current in the store
    } catch (error) {
      console.error('Failed to create new note:', error);
    }
  };

  const handleNoteClick = (note: (typeof filteredNotes)[0]) => {
    setCurrentNote(note);
    // Close sidebar on mobile after selecting a note
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  const formatDate = (date: Date | string) => {
    const noteDate = new Date(date);
    const today = new Date();

    if (noteDate.toDateString() === today.toDateString()) {
      return noteDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    return noteDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Generate preview text from note content
  const getPreviewText = (content: CustomElement[]): string => {
    if (!content || content.length === 0) return 'Empty note';

    try {
      const allText = serializeToPlainText(content).trim();

      if (!allText) return 'Empty note';

      // Return first 120 characters with ellipsis if longer
      const maxLength = 120;
      if (allText.length <= maxLength) {
        return allText;
      }

      return allText.substring(0, maxLength).trim() + '...';
    } catch {
      return 'Empty note';
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
        transform transition-transform duration-300 ease-in-out z-30 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-0
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Notes
          </h1>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* New Note Button */}
        <div className="p-4">
          <button
            onClick={handleNewNote}
            disabled={isLoading}
            className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="px-4 pb-2">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Loading notes...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleNoteClick(note)}
                  className={`w-full text-left p-3 rounded-lg transition-colors group border 
                           ${
                             currentNote?.id === note.id
                               ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                               : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                           }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {note.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {formatDate(note.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                    {getPreviewText(note.content)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
