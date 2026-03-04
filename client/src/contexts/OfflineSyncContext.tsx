import { createContext, useContext, ReactNode } from 'react';
import { useOfflineSync, type SyncStatus } from '@/hooks/useOfflineSync';

type OfflineSyncContextValue = {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  triggerSync: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
};

const OfflineSyncContext = createContext<OfflineSyncContextValue | null>(null);

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const value = useOfflineSync();
  return (
    <OfflineSyncContext.Provider value={value}>
      {children}
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSyncContext(): OfflineSyncContextValue {
  const ctx = useContext(OfflineSyncContext);
  if (!ctx) throw new Error('useOfflineSyncContext must be used inside OfflineSyncProvider');
  return ctx;
}
