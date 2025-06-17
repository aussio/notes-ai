import { supabase } from '@/lib/supabase';
import { notesDatabase, notecardsDatabase } from '@/lib/database';
import { SyncQueue, type SyncOperation } from './SyncQueue';
import { networkMonitor } from './NetworkMonitor';
import type { Note, Notecard } from '@/types';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  queueLength: number;
  error: string | null;
}

export class SyncService {
  private syncQueue: SyncQueue;
  private syncInProgress = false;
  private lastSyncTime: Date | null = null;
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();
  private networkUnsubscribe?: () => void;
  private periodicSyncInterval?: NodeJS.Timeout;
  private visibilityChangeHandler?: () => void;
  private windowFocusHandler?: () => void;

  constructor() {
    this.syncQueue = new SyncQueue();
    this.setupNetworkListener();
    this.setupPeriodicSync();
    this.setupVisibilitySync();
    this.loadLastSyncTime();

    // Process any queued operations from previous session
    this.processQueueOnStartup();
  }

  private setupNetworkListener(): void {
    this.networkUnsubscribe = networkMonitor.subscribe((isOnline) => {
      this.notifyStatusChange();
      if (isOnline && !this.syncInProgress) {
        // Auto-sync when coming back online
        this.processQueue();
      }
    });
  }

  private setupPeriodicSync(): void {
    // Sync every 5 minutes when online
    const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

    this.periodicSyncInterval = setInterval(() => {
      if (
        networkMonitor.isOnline &&
        !this.syncInProgress &&
        this.syncQueue.length > 0
      ) {
        this.processQueue();
      }
    }, SYNC_INTERVAL);
  }

  private setupVisibilitySync(): void {
    if (typeof document === 'undefined' || typeof window === 'undefined')
      return;

    this.visibilityChangeHandler = () => {
      // Sync when app becomes visible and we're online
      if (!document.hidden && networkMonitor.isOnline && !this.syncInProgress) {
        // Small delay to ensure app is fully focused
        setTimeout(() => {
          if (this.syncQueue.length > 0) {
            this.processQueue();
          }
        }, 1000);
      }
    };

    // Also sync on window focus for additional reliability
    const windowFocusHandler = () => {
      if (
        networkMonitor.isOnline &&
        !this.syncInProgress &&
        this.syncQueue.length > 0
      ) {
        setTimeout(() => this.processQueue(), 500);
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    window.addEventListener('focus', windowFocusHandler);

    // Store focus handler for cleanup
    this.windowFocusHandler = windowFocusHandler;
  }

  private loadLastSyncTime(): void {
    try {
      const stored = localStorage.getItem('last_sync_time');
      if (stored) {
        this.lastSyncTime = new Date(stored);
      }
    } catch (error) {
      console.error('Failed to load last sync time:', error);
    }
  }

  private saveLastSyncTime(): void {
    try {
      if (this.lastSyncTime) {
        localStorage.setItem('last_sync_time', this.lastSyncTime.toISOString());
      }
    } catch (error) {
      console.error('Failed to save last sync time:', error);
    }
  }

  private processQueueOnStartup(): void {
    // Small delay to ensure everything is initialized
    setTimeout(() => {
      if (networkMonitor.isOnline && this.syncQueue.length > 0) {
        this.processQueue();
      }
    }, 2000);
  }

  private notifyStatusChange(): void {
    const status = this.getStatus();
    this.statusListeners.forEach((listener) => listener(status));
  }

  getStatus(): SyncStatus {
    return {
      isOnline: networkMonitor.isOnline,
      isSyncing: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      queueLength: this.syncQueue.length,
      error: null, // TODO: Implement error tracking
    };
  }

  subscribeToStatus(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  async queueOperation(
    operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> {
    console.log('Queueing operation:', {
      type: operation.type,
      table: operation.table,
      userId: operation.userId,
      dataId: (operation.data as { id: string })?.id,
      isOnline: networkMonitor.isOnline,
      syncInProgress: this.syncInProgress,
    });

    await this.syncQueue.addOperation(operation);
    this.notifyStatusChange();

    // Try to sync immediately if online
    if (networkMonitor.isOnline && !this.syncInProgress) {
      this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.syncInProgress || !networkMonitor.isOnline) {
      return;
    }

    this.syncInProgress = true;
    this.syncQueue.setProcessing(true);
    this.notifyStatusChange();

    try {
      const operations = await this.syncQueue.getOperationsByPriority();

      for (const operation of operations) {
        try {
          await this.processOperation(operation);
          await this.syncQueue.removeOperation(operation.id);
        } catch (error) {
          console.error('Failed to process sync operation:', {
            operationId: operation.id,
            type: operation.type,
            table: operation.table,
            retryCount: operation.retryCount,
            error: error instanceof Error ? error.message : error,
          });

          const shouldRetry = await this.syncQueue.incrementRetryCount(
            operation.id
          );
          if (!shouldRetry) {
            console.warn(
              'Max retries reached, removing operation from queue:',
              {
                operationId: operation.id,
                type: operation.type,
                table: operation.table,
              }
            );
          }
        }
      }

      // Update last sync time
      this.lastSyncTime = new Date();
      this.saveLastSyncTime();
    } catch (error) {
      console.error('Failed to process sync queue:', error);
    } finally {
      this.syncInProgress = false;
      this.syncQueue.setProcessing(false);
      this.notifyStatusChange();
    }
  }

  private async processOperation(operation: SyncOperation): Promise<void> {
    const { type, table, data, userId } = operation;

    if (table === 'notes') {
      await this.processNoteOperation(type, data as Note, userId);
    } else if (table === 'notecards') {
      await this.processNotecardOperation(type, data as Notecard, userId);
    }
  }

  private async processNoteOperation(
    type: SyncOperation['type'],
    data: Note,
    userId: string
  ): Promise<void> {
    // Ensure dates are Date objects (they might be strings from serialization)
    const createdAt =
      data.createdAt instanceof Date
        ? data.createdAt
        : new Date(data.createdAt);
    const updatedAt =
      data.updatedAt instanceof Date
        ? data.updatedAt
        : new Date(data.updatedAt);

    console.log('Processing note operation:', {
      type,
      noteId: data.id,
      userId,
      title: data.title,
      contentLength: Array.isArray(data.content)
        ? data.content.length
        : 'not array',
      updatedAt: updatedAt.toISOString(),
    });

    const { error } = await (() => {
      switch (type) {
        case 'CREATE':
          return supabase.from('notes').insert({
            id: data.id,
            title: data.title,
            content: data.content,
            created_at: createdAt.toISOString(),
            updated_at: updatedAt.toISOString(),
            user_id: userId,
          });
        case 'UPDATE':
          return supabase
            .from('notes')
            .update({
              title: data.title,
              content: data.content,
              updated_at: updatedAt.toISOString(),
            })
            .eq('id', data.id)
            .eq('user_id', userId);
        case 'DELETE':
          return supabase
            .from('notes')
            .delete()
            .eq('id', data.id)
            .eq('user_id', userId);
        default:
          throw new Error(`Unknown operation type: ${type}`);
      }
    })();

    if (error) {
      console.error('Supabase operation failed:', {
        type,
        noteId: data.id,
        userId,
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
      });
      throw error;
    } else {
      console.log('Supabase operation succeeded:', {
        type,
        noteId: data.id,
        userId,
      });
    }
  }

  private async processNotecardOperation(
    type: SyncOperation['type'],
    data: Notecard,
    userId: string
  ): Promise<void> {
    // Ensure dates are Date objects (they might be strings from serialization)
    const createdAt =
      data.createdAt instanceof Date
        ? data.createdAt
        : new Date(data.createdAt);
    const updatedAt =
      data.updatedAt instanceof Date
        ? data.updatedAt
        : new Date(data.updatedAt);

    // Convert string content to Slate format for future-proofing
    const frontContent = [
      { type: 'paragraph', children: [{ text: data.front }] },
    ];
    const backContent = [
      { type: 'paragraph', children: [{ text: data.back }] },
    ];

    const { error } = await (() => {
      switch (type) {
        case 'CREATE':
          return supabase.from('notecards').insert({
            id: data.id,
            front_content: frontContent,
            back_content: backContent,
            created_at: createdAt.toISOString(),
            updated_at: updatedAt.toISOString(),
            user_id: userId,
          });
        case 'UPDATE':
          return supabase
            .from('notecards')
            .update({
              front_content: frontContent,
              back_content: backContent,
              updated_at: updatedAt.toISOString(),
            })
            .eq('id', data.id)
            .eq('user_id', userId);
        case 'DELETE':
          return supabase
            .from('notecards')
            .delete()
            .eq('id', data.id)
            .eq('user_id', userId);
        default:
          throw new Error(`Unknown operation type: ${type}`);
      }
    })();

    if (error) {
      throw error;
    }
  }

  async syncFromCloud(userId: string): Promise<void> {
    if (!networkMonitor.isOnline) {
      return;
    }

    try {
      // Sync notes from cloud
      const { data: cloudNotes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (notesError) throw notesError;

      if (cloudNotes) {
        for (const cloudNote of cloudNotes) {
          const localNote = await notesDatabase.getNoteById(
            cloudNote.id,
            userId
          );

          // Simple last-write-wins conflict resolution
          if (
            !localNote ||
            new Date(cloudNote.updated_at) > localNote.updatedAt
          ) {
            const note: Note = {
              id: cloudNote.id,
              user_id: cloudNote.user_id,
              title: cloudNote.title,
              content: cloudNote.content,
              createdAt: new Date(cloudNote.created_at),
              updatedAt: new Date(cloudNote.updated_at),
            };
            // Use updateNote with the note data, or create if it doesn't exist
            if (localNote) {
              await notesDatabase.updateNote(
                cloudNote.id,
                {
                  title: note.title,
                  content: note.content,
                  updatedAt: note.updatedAt,
                },
                userId
              );
            } else {
              // For new notes from cloud, we need to insert directly to preserve the ID
              // Since createNote generates a new ID, we'll use the database directly
              const { db } = await import('@/lib/database');
              await db.notes.add({
                id: cloudNote.id,
                user_id: cloudNote.user_id,
                title: cloudNote.title,
                content: JSON.stringify(cloudNote.content),
                createdAt: new Date(cloudNote.created_at).toISOString(),
                updatedAt: new Date(cloudNote.updated_at).toISOString(),
              });
            }
          }
        }
      }

      // Sync notecards from cloud
      const { data: cloudNotecards, error: notecardsError } = await supabase
        .from('notecards')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (notecardsError) throw notecardsError;

      if (cloudNotecards) {
        for (const cloudNotecard of cloudNotecards) {
          const localNotecard = await notecardsDatabase.getNotecardById(
            cloudNotecard.id,
            userId
          );

          // Simple last-write-wins conflict resolution
          if (
            !localNotecard ||
            new Date(cloudNotecard.updated_at) > localNotecard.updatedAt
          ) {
            // Extract text from Slate content format
            const extractText = (content: unknown[]): string => {
              if (!content || !Array.isArray(content)) return '';
              return content
                .map((node) => {
                  if (
                    node &&
                    typeof node === 'object' &&
                    'children' in node &&
                    Array.isArray(node.children)
                  ) {
                    return node.children
                      .map((child: unknown) => {
                        if (
                          child &&
                          typeof child === 'object' &&
                          'text' in child
                        ) {
                          return String(child.text || '');
                        }
                        return '';
                      })
                      .join('');
                  }
                  return '';
                })
                .join('');
            };

            const front = extractText(cloudNotecard.front_content);
            const back = extractText(cloudNotecard.back_content);

            // Use the existing database methods but with a direct insert/update to preserve ID
            if (localNotecard) {
              await notecardsDatabase.updateNotecard(
                cloudNotecard.id,
                {
                  front,
                  back,
                  updatedAt: new Date(cloudNotecard.updated_at),
                },
                userId
              );
            } else {
              // For new notecards from cloud, we need to insert directly to preserve the ID
              // Since createNotecard generates a new ID, we'll use the database directly
              const { db } = await import('@/lib/database');
              await db.notecards.add({
                id: cloudNotecard.id,
                user_id: cloudNotecard.user_id,
                front,
                back,
                createdAt: new Date(cloudNotecard.created_at).toISOString(),
                updatedAt: new Date(cloudNotecard.updated_at).toISOString(),
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync from cloud:', error);
      throw error;
    }
  }

  async manualSync(userId: string): Promise<void> {
    if (!networkMonitor.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    // First sync from cloud to get latest data
    await this.syncFromCloud(userId);

    // Then process local queue
    await this.processQueue();
  }

  destroy(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }

    if (this.periodicSyncInterval) {
      clearInterval(this.periodicSyncInterval);
    }

    if (this.visibilityChangeHandler && typeof document !== 'undefined') {
      document.removeEventListener(
        'visibilitychange',
        this.visibilityChangeHandler
      );
    }

    if (this.windowFocusHandler && typeof window !== 'undefined') {
      window.removeEventListener('focus', this.windowFocusHandler);
    }

    this.statusListeners.clear();
  }
}

// Singleton instance
export const syncService = new SyncService();
