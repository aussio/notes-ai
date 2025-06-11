'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CreditCard, Search } from 'lucide-react';
import { useNotecardsStore } from '@/store/notecardsStore';
import type { Notecard } from '@/types';

interface NotecardSelectorProps {
  onSelect: (notecard: Notecard) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const NotecardSelector: React.FC<NotecardSelectorProps> = ({
  onSelect,
  isOpen,
  onClose,
}) => {
  const { notecards, loadNotecards } = useNotecardsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load notecards when component mounts
  useEffect(() => {
    if (isOpen && notecards.length === 0) {
      loadNotecards();
    }
  }, [isOpen, notecards.length, loadNotecards]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Filter notecards based on search query
  const filteredNotecards = notecards.filter((notecard) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      notecard.front.toLowerCase().includes(query) ||
      notecard.back.toLowerCase().includes(query)
    );
  });

  const handleSelect = (notecard: Notecard) => {
    onSelect(notecard);
    setSearchQuery('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 z-50 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
    >
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search notecards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Notecards List */}
      <div className="max-h-60 overflow-y-auto">
        {filteredNotecards.length > 0 ? (
          <div className="p-1">
            {filteredNotecards.map((notecard) => (
              <button
                key={notecard.id}
                onClick={() => handleSelect(notecard)}
                className="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <CreditCard className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {notecard.front || 'Empty front'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                      {notecard.back || 'Empty back'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {notecard.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {searchQuery ? 'No notecards found' : 'No notecards available'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {searchQuery
                ? 'Try a different search term'
                : 'Create a notecard first'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
