'use client';

import React, { useState, useRef, useEffect } from 'react';

interface NotecardFieldProps {
  value: string;
  placeholder: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
  autoFocus?: boolean;
  forceEdit?: boolean;
  onTabNext?: () => void;
  onTabPrevious?: () => void;
  onTabExit?: () => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

export const NotecardField: React.FC<NotecardFieldProps> = ({
  value,
  placeholder,
  onSave,
  className = '',
  autoFocus = false,
  forceEdit = false,
  onTabNext,
  onTabPrevious,
  onTabExit,
  onEditStart,
  onEditEnd,
}) => {
  const [isEditing, setIsEditing] = useState(autoFocus);
  const [editValue, setEditValue] = useState('');
  const [isNavigating, setIsNavigating] = useState(false); // Track if we're navigating via Tab
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when autoFocus prop is true
  useEffect(() => {
    if (autoFocus && !value && !isEditing) {
      setIsEditing(true);
      setEditValue(value); // Use the current value, even if it's empty
      onEditStart?.();
    }
  }, [autoFocus, value, isEditing, onEditStart]);

  // Force edit mode when forceEdit prop changes
  useEffect(() => {
    if (forceEdit && !isEditing) {
      setIsEditing(true);
      setEditValue(value);
      onEditStart?.();
    }
  }, [forceEdit, value, isEditing, onEditStart]);

  // Auto-resize textarea and focus when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.select();

      // Auto-resize
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleFieldClick = () => {
    setIsEditing(true);
    setEditValue(value);
    onEditStart?.();
  };

  const handleSave = async () => {
    try {
      await onSave(editValue);
      setIsEditing(false);
      onEditEnd?.();
    } catch (error) {
      console.error('Failed to save field:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
    onEditEnd?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setIsNavigating(true); // Mark that we're navigating

      if (e.shiftKey && onTabPrevious) {
        handleSave().then(() => onTabPrevious());
      } else if (!e.shiftKey && onTabNext) {
        handleSave().then(() => onTabNext());
      } else if (!e.shiftKey && onTabExit) {
        handleSave().then(() => onTabExit());
      }

      // Reset navigation flag after a short delay
      setTimeout(() => setIsNavigating(false), 100);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleBlur = () => {
    // Only save on blur if we're not navigating via Tab
    // This prevents conflicts between Tab navigation and blur events
    if (!isNavigating) {
      handleSave();
    }
  };

  return (
    <div className={className}>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full p-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
        />
      ) : (
        <div
          className="cursor-text hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded transition-colors"
          onClick={handleFieldClick}
          title={`Click to edit ${placeholder.toLowerCase()}`}
        >
          <p className="text-sm text-gray-900 dark:text-gray-100 min-h-[1.25rem]">
            {value || `Click to add ${placeholder.toLowerCase()}...`}
          </p>
        </div>
      )}
    </div>
  );
};
