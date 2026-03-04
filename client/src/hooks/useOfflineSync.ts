import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useOnlineStatus } from './useOnlineStatus';
import { processSyncQueue, buildTrpcFetcher, getPendingCount } from '@/lib/syncManager';
import { trpc } from '@/lib/trpc';

const SYNC_DEBOUNCE_MS = 1500;

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utils = trpc.useUtils();

  // Refresh pending count
  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  // Trigger sync
  const triggerSync = useCallback(async () => {
    const count = await getPendingCount();
    if (count === 0) return;

    setSyncStatus('syncing');

    const fetcher = buildTrpcFetcher(window.location.origin);
    const result = await processSyncQueue(fetcher, {
      onStart: () => {
        console.log('[useOfflineSync] Starting sync...');
      },
      onComplete: async (r) => {
        await refreshPendingCount();
        if (r.processed > 0) {
          // Invalidate all relevant queries to refresh UI with server data
          await Promise.all([
            utils.transactions.list.invalidate(),
            utils.dashboard.monthly.invalidate(),
            utils.dashboard.history.invalidate(),
            utils.investments.list.invalidate(),
            utils.categories.list.invalidate(),
          ]);

          if (r.failed === 0) {
            setSyncStatus('success');
            toast.success(`✓ ${r.processed} operação${r.processed > 1 ? 'ões' : ''} sincronizada${r.processed > 1 ? 's' : ''}`, {
              duration: 3000,
            });
          } else {
            setSyncStatus('error');
            toast.warning(`Sincronização parcial: ${r.processed} ok, ${r.failed} com erro`);
          }
        } else {
          setSyncStatus('idle');
        }
      },
    });

    if (result.processed === 0 && result.failed === 0) {
      setSyncStatus('idle');
    }
  }, [refreshPendingCount, utils]);

  // Auto-sync when coming back online (with debounce)
  useEffect(() => {
    if (isOnline) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        triggerSync();
      }, SYNC_DEBOUNCE_MS);
    } else {
      setSyncStatus('idle');
    }

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [isOnline, triggerSync]);

  // Listen for SW messages to process queue
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PROCESS_SYNC_QUEUE') {
        triggerSync();
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage);
  }, [triggerSync]);

  // Initial count on mount
  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  return {
    isOnline,
    syncStatus,
    pendingCount,
    triggerSync,
    refreshPendingCount,
  };
}
