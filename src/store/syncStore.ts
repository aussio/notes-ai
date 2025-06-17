import { create } from 'zustand';
import { syncService, type SyncStatus } from '@/lib/sync/SyncService';
import { useAuthStore } from './authStore';

interface SyncStore {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
  manualSync: () => Promise<void>;
  queueOperation: (operation: {
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    table: 'notes' | 'notecards';
    data: unknown;
  }) => Promise<void>;
}

export const useSyncStore = create<SyncStore>((set) => {
  // Subscribe to sync service status changes
  syncService.subscribeToStatus((status) => {
    set({ status });
  });

  // Clean up subscription when store is destroyed
  // Note: Zustand doesn't have a built-in cleanup mechanism,
  // so we'll handle this in the component lifecycle

  return {
    status: syncService.getStatus(),

    setStatus: (status) => set({ status }),

    manualSync: async () => {
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        await syncService.manualSync(user.id);
      } catch (error) {
        console.error('Manual sync failed:', error);
        throw error;
      }
    },

    queueOperation: async (operation) => {
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('User not authenticated');
      }

      await syncService.queueOperation({
        ...operation,
        userId: user.id,
      });
    },
  };
});

// Helper hook to get sync status
export const useSyncStatus = () => {
  const status = useSyncStore((state) => state.status);
  return status;
};

// Helper hook for sync operations
export const useSyncOperations = () => {
  const { manualSync, queueOperation } = useSyncStore((state) => ({
    manualSync: state.manualSync,
    queueOperation: state.queueOperation,
  }));

  return { manualSync, queueOperation };
};
