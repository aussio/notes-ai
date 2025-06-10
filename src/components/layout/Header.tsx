'use client';

import { Menu, MoreVertical, Save, Trash2, Bug } from 'lucide-react';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentNoteTitle?: string;
  isSaving?: boolean;
  onDelete?: () => void;
  onTitleChange?: (newTitle: string) => void;
  onToggleDebug?: () => void;
  isDebugVisible?: boolean;
}

export default function Header({
  onToggleSidebar,
  currentNoteTitle,
  isSaving = false,
  onDelete,
  onTitleChange,
  onToggleDebug,
  isDebugVisible = false,
}: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  // Sync edit title with current note title when it changes
  useEffect(() => {
    setEditTitle(currentNoteTitle || '');
  }, [currentNoteTitle]);

  const handleTitleChange = async (newTitle: string) => {
    setEditTitle(newTitle);
    const trimmedTitle = newTitle.trim();
    if (trimmedTitle && trimmedTitle !== currentNoteTitle && onTitleChange) {
      await onTitleChange(trimmedTitle);
    }
  };

  const handleTitleSubmit = async () => {
    setIsEditing(false);
    // Final save on submit if needed
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle && trimmedTitle !== currentNoteTitle && onTitleChange) {
      await onTitleChange(trimmedTitle || 'Untitled Note');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditTitle(currentNoteTitle || '');
      setIsEditing(false);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
      {/* Mobile menu button */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden mr-2"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Current note title */}
      <div className="flex-1 min-w-0">
        {currentNoteTitle ? (
          isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              className="text-xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white w-full"
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 py-1 -mx-2 -my-1"
              onClick={() => setIsEditing(true)}
              title="Click to edit title"
            >
              {currentNoteTitle}
            </h1>
          )
        ) : (
          <h1 className="text-xl font-semibold text-gray-500 dark:text-gray-400">
            Select a note to begin
          </h1>
        )}
      </div>

      {/* Save status */}
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mr-4">
          <Save className="w-4 h-4 animate-pulse" />
          Saving...
        </div>
      )}

      {/* Actions menu */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Debug button - always visible in development */}
        {process.env.NODE_ENV === 'development' && onToggleDebug && (
          <button
            onClick={onToggleDebug}
            className={`p-2 rounded-lg transition-colors ${
              isDebugVisible
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
            title="Toggle Slate debug panel"
          >
            <Bug className="w-4 h-4" />
          </button>
        )}

        {/* Note-specific actions */}
        {currentNoteTitle && (
          <>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
