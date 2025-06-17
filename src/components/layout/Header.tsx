'use client';

import { Menu, Trash2, Bug, User, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import UserAvatar from '@/components/auth/UserAvatar';
import { useUser } from '@/store/authStore';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentNoteTitle?: string;
  onDelete?: () => void;
  onTitleChange?: (newTitle: string) => void;
  onToggleDebug?: () => void;
  isDebugVisible?: boolean;
}

export default function Header({
  onToggleSidebar,
  currentNoteTitle,
  onDelete,
  onTitleChange,
  onToggleDebug,
  isDebugVisible,
}: HeaderProps) {
  const router = useRouter();
  const user = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(currentNoteTitle || '');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Update local title when prop changes
  useEffect(() => {
    setTitle(currentNoteTitle || '');
  }, [currentNoteTitle]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    if (onTitleChange && title.trim()) {
      onTitleChange(title.trim());
    }
    setIsEditing(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitle(currentNoteTitle || '');
      setIsEditing(false);
    }
  };

  const handleUserMenuClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Title editing */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleTitleKeyPress}
                className="text-lg font-semibold bg-transparent border-b-2 border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditing(true)}
                className="text-lg font-semibold text-gray-900 dark:text-white cursor-text hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Click to edit title"
              >
                {currentNoteTitle || 'Untitled'}
              </h1>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Debug toggle */}
          {onToggleDebug && (
            <button
              onClick={onToggleDebug}
              className={`p-2 rounded-lg transition-colors ${
                isDebugVisible
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
              title="Toggle debug panel"
            >
              <Bug className="w-5 h-5" />
            </button>
          )}

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete current item"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}

          {/* User menu - rightmost */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={handleUserMenuClick}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <UserAvatar user={user} size="md" />
                <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-white">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.user_metadata?.full_name ||
                            user.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile & Settings
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <div className="px-4 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Theme
                      </span>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
