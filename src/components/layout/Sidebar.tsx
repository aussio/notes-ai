'use client';

import { Plus, Search, Menu, FileText, CreditCard, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNotesStore, useFilteredNotes } from '@/store/notesStore';
import {
  useNotecardsStore,
  useFilteredNotecards,
} from '@/store/notecardsStore';
import {
  serializeToPlainText,
  findNotesWithNotecardEmbeds,
} from '@/lib/editor';
import { DeleteNotecardModal } from '@/components/notecards/DeleteNotecardModal';
import type { CustomElement, Notecard } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { SyncStatus } from './SyncStatus';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Notes store
  const {
    searchQuery: notesSearchQuery,
    setSearchQuery: setNotesSearchQuery,
    createNote,
    setCurrentNote,
    currentNote,
    isLoading: notesLoading,
    error: notesError,
  } = useNotesStore();

  // Notecards store
  const {
    searchQuery: notecardsSearchQuery,
    setSearchQuery: setNotecardsSearchQuery,
    createNotecard,
    setCurrentNotecard,
    currentNotecard,
    isLoading: notecardsLoading,
    error: notecardsError,
    deleteNotecard,
  } = useNotecardsStore();

  // Get filtered data
  const filteredNotes = useFilteredNotes();
  const filteredNotecards = useFilteredNotecards();

  // Modal state for notecard deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notecardToDelete, setNotecardToDelete] = useState<Notecard | null>(
    null
  );

  // Determine current context
  const isNotecards = pathname === '/notecards';
  const searchQuery = isNotecards ? notecardsSearchQuery : notesSearchQuery;
  const setSearchQuery = isNotecards
    ? setNotecardsSearchQuery
    : setNotesSearchQuery;
  const isLoading = isNotecards ? notecardsLoading : notesLoading;
  const error = isNotecards ? notecardsError : notesError;

  const handleNewItem = async () => {
    try {
      if (isNotecards) {
        const newNotecard = await createNotecard('Front text', 'Back text');
        setCurrentNotecard(newNotecard);
      } else {
        await createNote();
        // The new note is automatically set as current in the store
      }
    } catch (error) {
      console.error(
        `Failed to create ${isNotecards ? 'notecard' : 'note'}:`,
        error
      );
    }
  };

  const handleNoteClick = (note: (typeof filteredNotes)[0]) => {
    setCurrentNote(note);
    // Close sidebar on mobile after selecting a note
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  const handleNotecardClick = (notecard: Notecard) => {
    setCurrentNotecard(notecard);
    // Close sidebar on mobile after selecting a notecard
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  const handleDeleteClick = (notecard: Notecard, event: React.MouseEvent) => {
    event.stopPropagation();
    setNotecardToDelete(notecard);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (notecardToDelete) {
      try {
        await deleteNotecard(notecardToDelete.id);
      } catch (error) {
        console.error('Failed to delete notecard:', error);
      }
    }
    setNotecardToDelete(null);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    // Close sidebar on mobile after navigation
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
          <div className="flex items-center gap-3">
            <Image
              src="/teal_duck_logo.png"
              alt="Teal Duck Logo"
              width={32}
              height={32}
            />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isNotecards ? 'Notecards' : 'Notes'}
            </h1>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
            aria-label="Close sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 pt-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => handleNavigate('/')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                !isNotecards
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Notes
            </button>
            <button
              onClick={() => handleNavigate('/notecards')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isNotecards
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Notecards
            </button>
          </div>
        </div>

        {/* New Item Button */}
        <div className="p-4">
          <button
            onClick={handleNewItem}
            disabled={isLoading}
            className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isNotecards ? 'New Notecard' : 'New Note'}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${isNotecards ? 'notecards' : 'notes'}...`}
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

        {/* Items List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Loading {isNotecards ? 'notecards' : 'notes'}...
            </div>
          ) : isNotecards ? (
            /* Notecards List */
            filteredNotecards.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No notecards found' : 'No notecards yet'}
              </div>
            ) : (
              <div className="space-y-1 px-2">
                {filteredNotecards.map((notecard) => (
                  <div
                    key={notecard.id}
                    className={`relative rounded-lg transition-colors group border 
                             ${
                               currentNotecard?.id === notecard.id
                                 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                 : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                             }`}
                  >
                    <button
                      onClick={() => handleNotecardClick(notecard)}
                      className="w-full text-left p-3 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2 pr-8">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {notecard.front || 'Empty front'}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {formatDate(notecard.updatedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                        {notecard.back || 'Empty back'}
                      </p>
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(notecard, e)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : /* Notes List */
          filteredNotes.length === 0 ? (
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

        {/* Sync Status */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <SyncStatus />
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteNotecardModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        notecardFront={notecardToDelete?.front || ''}
        notesContaining={
          notecardToDelete
            ? findNotesWithNotecardEmbeds(filteredNotes, notecardToDelete.id)
            : []
        }
      />
    </>
  );
}
