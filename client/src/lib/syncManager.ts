/**
 * FINANÇAS - Sync Manager
 *
 * Processes the offline sync queue when the device comes back online.
 * Each operation in the queue is replayed against the tRPC server.
 */

import {
  getSyncQueue,
  removeSyncOperation,
  updateSyncOperationRetries,
  getSyncQueueCount,
  type SyncOperation,
} from './offlineDb';

const MAX_RETRIES = 3;

type SyncResult = {
  processed: number;
  failed: number;
  errors: string[];
};

type SyncCallbacks = {
  onStart?: () => void;
  onProgress?: (processed: number, total: number) => void;
  onComplete?: (result: SyncResult) => void;
  onError?: (op: SyncOperation, error: Error) => void;
};

let isSyncing = false;

/**
 * Process all pending sync operations.
 * @param fetcher - Function to execute a tRPC-style mutation via fetch
 * @param callbacks - Optional lifecycle callbacks
 */
export async function processSyncQueue(
  fetcher: (procedure: string, input: unknown) => Promise<unknown>,
  callbacks?: SyncCallbacks
): Promise<SyncResult> {
  if (isSyncing) {
    console.log('[SyncManager] Already syncing, skipping');
    return { processed: 0, failed: 0, errors: [] };
  }

  const queue = await getSyncQueue();
  if (queue.length === 0) {
    return { processed: 0, failed: 0, errors: [] };
  }

  isSyncing = true;
  callbacks?.onStart?.();

  const result: SyncResult = { processed: 0, failed: 0, errors: [] };
  const total = queue.length;

  // Sort by enqueuedAt to preserve operation order
  const sorted = [...queue].sort((a, b) => a.enqueuedAt - b.enqueuedAt);

  for (const op of sorted) {
    try {
      console.log('[SyncManager] Processing:', op.procedure, op.input);
      await fetcher(op.procedure, op.input);
      await removeSyncOperation(op.id!);
      result.processed++;
      callbacks?.onProgress?.(result.processed, total);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[SyncManager] Failed to sync:', op.procedure, err.message);

      const newRetries = (op.retries || 0) + 1;
      if (newRetries >= MAX_RETRIES) {
        console.warn('[SyncManager] Max retries reached, removing op:', op.id);
        await removeSyncOperation(op.id!);
        result.failed++;
        result.errors.push(`${op.procedure}: ${err.message}`);
      } else {
        await updateSyncOperationRetries(op.id!, newRetries);
        result.failed++;
      }

      callbacks?.onError?.(op, err);
    }
  }

  isSyncing = false;
  callbacks?.onComplete?.(result);
  return result;
}

export async function getPendingCount(): Promise<number> {
  return getSyncQueueCount();
}

export function getIsSyncing(): boolean {
  return isSyncing;
}

/**
 * Build a fetcher that calls tRPC procedures via HTTP POST.
 * Used by the sync manager to replay queued operations.
 */
export function buildTrpcFetcher(baseUrl: string) {
  return async (procedure: string, input: unknown): Promise<unknown> => {
    const url = `${baseUrl}/api/trpc/${procedure}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ json: input }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // tRPC error format
    if (data?.error) {
      throw new Error(data.error.message || 'tRPC error');
    }

    return data?.result?.data?.json ?? data;
  };
}
