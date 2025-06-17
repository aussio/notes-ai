export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: 'notes' | 'notecards';
  data: unknown;
  timestamp: Date;
  retryCount: number;
  userId: string;
}

export class SyncQueue {
  private static readonly QUEUE_KEY = 'sync_queue';
  private static readonly MAX_RETRIES = 3;

  private queue: SyncOperation[] = [];
  private processing = false;

  constructor() {
    this.loadQueue();
  }

  private async loadQueue(): Promise<void> {
    try {
      const stored = localStorage.getItem(SyncQueue.QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored).map((op: unknown) => ({
          ...(op as SyncOperation),
          timestamp: new Date((op as SyncOperation).timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.queue = [];
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      localStorage.setItem(SyncQueue.QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  async addOperation(
    operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> {
    const syncOp: SyncOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      retryCount: 0,
    };

    this.queue.push(syncOp);
    await this.saveQueue();
  }

  async getOperations(): Promise<SyncOperation[]> {
    return [...this.queue];
  }

  async removeOperation(operationId: string): Promise<void> {
    this.queue = this.queue.filter((op) => op.id !== operationId);
    await this.saveQueue();
  }

  async incrementRetryCount(operationId: string): Promise<boolean> {
    const operation = this.queue.find((op) => op.id === operationId);
    if (!operation) return false;

    operation.retryCount++;

    if (operation.retryCount >= SyncQueue.MAX_RETRIES) {
      // Remove failed operations after max retries
      await this.removeOperation(operationId);
      return false;
    }

    await this.saveQueue();
    return true;
  }

  async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  get length(): number {
    return this.queue.length;
  }

  get isProcessing(): boolean {
    return this.processing;
  }

  setProcessing(processing: boolean): void {
    this.processing = processing;
  }

  // Get operations sorted by timestamp (oldest first)
  async getOperationsByPriority(): Promise<SyncOperation[]> {
    return this.queue.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  // Get operations for a specific table
  async getOperationsForTable(
    table: 'notes' | 'notecards'
  ): Promise<SyncOperation[]> {
    return this.queue.filter((op) => op.table === table);
  }
}
