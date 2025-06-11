'use client';

import React from 'react';
import { RenderElementProps } from 'slate-react';
import { useNotecardsStore } from '@/store/notecardsStore';
import type { NotecardEmbedElement } from '@/types';

interface NotecardEmbedProps extends RenderElementProps {
  element: NotecardEmbedElement;
}

export const NotecardEmbed: React.FC<NotecardEmbedProps> = ({
  element,
  children,
  attributes,
}) => {
  const { getNotecardById } = useNotecardsStore();
  const notecard = getNotecardById(element.notecardId);

  return (
    <div {...attributes} className="my-4">
      <div contentEditable={false} className="relative">
        <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 shadow-sm">
          {notecard ? (
            <div className="space-y-3">
              {/* Front */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                    Front
                  </span>
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 pl-4">
                  {notecard.front || 'Empty front'}
                </p>
              </div>

              {/* Back */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                    Back
                  </span>
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 pl-4">
                  {notecard.back || 'Empty back'}
                </p>
              </div>

              {/* Meta */}
              <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Notecard • {notecard.updatedAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-red-600 dark:text-red-400">
                Notecard not found (ID: {element.notecardId})
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The referenced notecard may have been deleted
              </p>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};
