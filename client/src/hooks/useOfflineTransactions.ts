/**
 * useOfflineTransactions
 *
 * Wraps the transactions.create mutation to support offline mode:
 * - When online: calls tRPC normally
 * - When offline: saves to IndexedDB sync queue and updates local cache optimistically
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useOfflineSyncContext } from '@/contexts/OfflineSyncContext';
import {
  enqueueSyncOperation,
  generateLocalId,
  cacheTransactions,
  getLocalTransactions,
} from '@/lib/offlineDb';

type CreateTransactionInput = {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: number;
  paymentMethod: 'pix' | 'credit' | 'debit' | 'cash' | 'boleto';
  expenseType: 'fixed' | 'variable';
  transactionDate: string;
  notes?: string;
  installments?: number;
};

export function useOfflineTransactions() {
  const { isOnline, refreshPendingCount } = useOfflineSyncContext();
  const utils = trpc.useUtils();

  const createMutation = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      utils.dashboard.monthly.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao criar transação: ${err.message}`);
    },
  });

  const createTransaction = useCallback(
    async (input: CreateTransactionInput) => {
      if (isOnline) {
        // Normal online flow
        return createMutation.mutateAsync(input);
      }

      // Offline flow: enqueue and save locally
      const localId = generateLocalId();
      const now = Date.now();

      // Parse year/month from date string
      const [year, month] = input.transactionDate.split('-').map(Number);

      // Create a local representation
      const localTx = {
        id: localId,
        ...input,
        userId: -1, // placeholder
        year,
        month,
        createdAt: now,
        isLocal: true,
      };

      // Save to local cache
      const existing = await getLocalTransactions(year, month);
      await cacheTransactions([...existing, localTx]);

      // Enqueue for sync
      await enqueueSyncOperation({
        procedure: 'transactions.create',
        input,
        enqueuedAt: now,
        retries: 0,
        localId,
      });

      await refreshPendingCount();

      toast.info('Transação salva localmente. Será sincronizada quando houver conexão.', {
        duration: 4000,
      });

      // Optimistically update the tRPC cache
      utils.transactions.list.invalidate();

      return localTx;
    },
    [isOnline, createMutation, refreshPendingCount, utils]
  );

  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      utils.dashboard.monthly.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao excluir: ${err.message}`);
    },
  });

  const deleteTransaction = useCallback(
    async (input: { id: number; deleteGroup?: boolean }) => {
      if (isOnline) {
        return deleteMutation.mutateAsync(input);
      }

      // Offline: enqueue delete
      await enqueueSyncOperation({
        procedure: 'transactions.delete',
        input,
        enqueuedAt: Date.now(),
        retries: 0,
      });

      await refreshPendingCount();
      toast.info('Exclusão salva localmente. Será sincronizada quando houver conexão.', { duration: 4000 });
      utils.transactions.list.invalidate();
    },
    [isOnline, deleteMutation, refreshPendingCount, utils]
  );

  return {
    createTransaction,
    deleteTransaction,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
