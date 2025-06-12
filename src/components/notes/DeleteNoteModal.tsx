'use client';

import React from 'react';
import { AlertTriangle, FileText, Info } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { InfoBox } from '@/components/ui/InfoBox';
import { ItemPreview } from '@/components/ui/ItemPreview';
import type { Note } from '@/types';

interface DeleteNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  note: Note | null;
  hasEmbeddedNotecards?: boolean;
}

export const DeleteNoteModal: React.FC<DeleteNoteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  note,
  hasEmbeddedNotecards = false,
}) => {
  if (!note) return null;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Note"
      icon={AlertTriangle}
      confirmText="Delete Note"
    >
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Are you sure you want to permanently delete this note?
      </p>

      {/* Note preview */}
      <ItemPreview
        icon={FileText}
        title={note.title}
        subtitle={`Created ${note.createdAt.toLocaleDateString()} • Last updated ${note.updatedAt.toLocaleDateString()}`}
        className="mb-4"
      />

      {/* Embedded notecards info */}
      {hasEmbeddedNotecards && (
        <InfoBox variant="success" icon={Info} className="mb-4">
          <strong>Note:</strong> Any notecards embedded in this note will be
          preserved and remain available in your notecards collection.
        </InfoBox>
      )}

      <InfoBox variant="warning">
        <strong>Warning:</strong> This action cannot be undone. The note and all
        its content will be permanently deleted.
      </InfoBox>
    </ConfirmationModal>
  );
};
