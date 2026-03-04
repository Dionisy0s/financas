/**
 * useOfflineInvestments
 *
 * Wraps investment mutations to support offline mode:
 * - When online: calls tRPC normally
 * - When offline: saves to IndexedDB sync queue
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useOfflineSyncContext } from '@/contexts/OfflineSyncContext';
import { enqueueSyncOperation, generateLocalId } from '@/lib/offlineDb';

type CreateInvestmentInput = {
  name: string;
  categoryId: number;
  amount: number;
  investmentDate: string;
  notes?: string;
};

type UpdateInvestmentInput = {
  id: number;
  name?: string;
  categoryId?: number;
  amount?: number;
  investmentDate?: string;
  notes?: string;
};

export function useOfflineInvestments() {
  const { isOnline, refreshPendingCount } = useOfflineSyncContext();
  const utils = trpc.useUtils();

  // ─── Create ───────────────────────────────────────────────────────────────
  const createMutation = trpc.investments.create.useMutation({
    onSuccess: () => {
      utils.investments.list.invalidate();
      toast.success('Investimento adicionado com sucesso!');
    },
    onError: (err) => toast.error(`Erro ao criar investimento: ${err.message}`),
  });

  const createInvestment = useCallback(
    async (input: CreateInvestmentInput) => {
      if (isOnline) {
        return createMutation.mutateAsync(input);
      }

      const localId = generateLocalId();
      await enqueueSyncOperation({
        procedure: 'investments.create',
        input,
        enqueuedAt: Date.now(),
        retries: 0,
        localId,
      });
      await refreshPendingCount();
      toast.info('Investimento salvo localmente. Será sincronizado quando houver conexão.', { duration: 4000 });
      utils.investments.list.invalidate();
      return { id: localId };
    },
    [isOnline, createMutation, refreshPendingCount, utils]
  );

  // ─── Update ───────────────────────────────────────────────────────────────
  const updateMutation = trpc.investments.update.useMutation({
    onSuccess: () => {
      utils.investments.list.invalidate();
      toast.success('Investimento atualizado!');
    },
    onError: (err) => toast.error(`Erro ao atualizar: ${err.message}`),
  });

  const updateInvestment = useCallback(
    async (input: UpdateInvestmentInput) => {
      if (isOnline) {
        return updateMutation.mutateAsync(input);
      }

      await enqueueSyncOperation({
        procedure: 'investments.update',
        input,
        enqueuedAt: Date.now(),
        retries: 0,
      });
      await refreshPendingCount();
      toast.info('Atualização salva localmente. Será sincronizada quando houver conexão.', { duration: 4000 });
      utils.investments.list.invalidate();
    },
    [isOnline, updateMutation, refreshPendingCount, utils]
  );

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteMutation = trpc.investments.delete.useMutation({
    onSuccess: () => {
      utils.investments.list.invalidate();
      toast.success('Investimento excluído!');
    },
    onError: (err) => toast.error(`Erro ao excluir: ${err.message}`),
  });

  const deleteInvestment = useCallback(
    async (id: number) => {
      if (isOnline) {
        return deleteMutation.mutateAsync({ id });
      }

      await enqueueSyncOperation({
        procedure: 'investments.delete',
        input: { id },
        enqueuedAt: Date.now(),
        retries: 0,
      });
      await refreshPendingCount();
      toast.info('Exclusão salva localmente. Será sincronizada quando houver conexão.', { duration: 4000 });
      utils.investments.list.invalidate();
    },
    [isOnline, deleteMutation, refreshPendingCount, utils]
  );

  return {
    createInvestment,
    updateInvestment,
    deleteInvestment,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
