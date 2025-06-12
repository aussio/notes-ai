'use client';

import React from 'react';
import { AlertTriangle, FileText, CreditCard } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { InfoBox } from '@/components/ui/InfoBox';
import { ItemPreview } from '@/components/ui/ItemPreview';
import type { Note } from '@/types';

interface DeleteNotecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  notecardFront: string;
  notesContaining: Note[];
}

export const DeleteNotecardModal: React.FC<DeleteNotecardModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  notecardFront,
  notesContaining,
}) => {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Notecard"
      icon={AlertTriangle}
      confirmText="Delete Notecard"
    >
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Are you sure you want to permanently delete this notecard?
      </p>

      {/* Notecard preview */}
      <ItemPreview
        icon={CreditCard}
        title={`"${notecardFront || 'Empty notecard'}"`}
        className="mb-4"
      />

      {/* Notes containing this notecard */}
      {notesContaining.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            This notecard is used in {notesContaining.length} note
            {notesContaining.length === 1 ? '' : 's'}:
          </p>
          <div className="max-h-32 overflow-y-auto">
            <ul className="space-y-1">
              {notesContaining.map((note) => (
                <li
                  key={note.id}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{note.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <InfoBox variant="warning">
        <strong>Warning:</strong> This action cannot be undone. The notecard
        will be removed from all notes permanently.
      </InfoBox>
    </ConfirmationModal>
  );
};
