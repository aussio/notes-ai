import { useCallback } from 'react';
import { useSyncStatus, useSyncOperations } from '@/store/syncStore';
import { useNetworkStatus } from './useNetworkStatus';
import type { Note, Notecard } from '@/types';

export const useSync = () => {
  const syncStatus = useSyncStatus();
  const { manualSync, queueOperation } = useSyncOperations();
  const isOnline = useNetworkStatus();

  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      await manualSync();
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }, [isOnline, manualSync]);

  const queueNoteOperation = useCallback(
    async (type: 'CREATE' | 'UPDATE' | 'DELETE', data: Note) => {
      await queueOperation({
        type,
        table: 'notes',
        data,
      });
    },
    [queueOperation]
  );

  const queueNotecardOperation = useCallback(
    async (type: 'CREATE' | 'UPDATE' | 'DELETE', data: Notecard) => {
      await queueOperation({
        type,
        table: 'notecards',
        data,
      });
    },
    [queueOperation]
  );

  return {
    // Status
    isOnline,
    isSyncing: syncStatus.isSyncing,
    lastSyncTime: syncStatus.lastSyncTime,
    queueLength: syncStatus.queueLength,
    syncError: syncStatus.error,

    // Operations
    triggerSync,
    queueNoteOperation,
    queueNotecardOperation,
  };
};
