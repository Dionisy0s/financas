/**
 * useOfflineCategories
 *
 * Wraps category mutations to support offline mode:
 * - When online: calls tRPC normally
 * - When offline: saves to IndexedDB sync queue
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useOfflineSyncContext } from '@/contexts/OfflineSyncContext';
import { enqueueSyncOperation, generateLocalId } from '@/lib/offlineDb';

type CreateCategoryInput = {
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
};

type UpdateCategoryInput = {
  id: number;
  name?: string;
  color?: string;
  icon?: string;
};

export function useOfflineCategories() {
  const { isOnline, refreshPendingCount } = useOfflineSyncContext();
  const utils = trpc.useUtils();

  // ─── Create ───────────────────────────────────────────────────────────────
  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success('Categoria criada com sucesso!');
    },
    onError: (err) => toast.error(`Erro ao criar categoria: ${err.message}`),
  });

  const createCategory = useCallback(
    async (input: CreateCategoryInput) => {
      if (isOnline) {
        return createMutation.mutateAsync(input);
      }

      const localId = generateLocalId();
      await enqueueSyncOperation({
        procedure: 'categories.create',
        input,
        enqueuedAt: Date.now(),
        retries: 0,
        localId,
      });
      await refreshPendingCount();
      toast.info('Categoria salva localmente. Será sincronizada quando houver conexão.', { duration: 4000 });
      utils.categories.list.invalidate();
      return { id: localId };
    },
    [isOnline, createMutation, refreshPendingCount, utils]
  );

  // ─── Update ───────────────────────────────────────────────────────────────
  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success('Categoria atualizada!');
    },
    onError: (err) => toast.error(`Erro ao atualizar: ${err.message}`),
  });

  const updateCategory = useCallback(
    async (input: UpdateCategoryInput) => {
      if (isOnline) {
        return updateMutation.mutateAsync(input);
      }

      await enqueueSyncOperation({
        procedure: 'categories.update',
        input,
        enqueuedAt: Date.now(),
        retries: 0,
      });
      await refreshPendingCount();
      toast.info('Atualização salva localmente. Será sincronizada quando houver conexão.', { duration: 4000 });
      utils.categories.list.invalidate();
    },
    [isOnline, updateMutation, refreshPendingCount, utils]
  );

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success('Categoria excluída!');
    },
    onError: (err) => toast.error(`Erro ao excluir: ${err.message}`),
  });

  const deleteCategory = useCallback(
    async (id: number) => {
      if (isOnline) {
        return deleteMutation.mutateAsync({ id });
      }

      await enqueueSyncOperation({
        procedure: 'categories.delete',
        input: { id },
        enqueuedAt: Date.now(),
        retries: 0,
      });
      await refreshPendingCount();
      toast.info('Exclusão salva localmente. Será sincronizada quando houver conexão.', { duration: 4000 });
      utils.categories.list.invalidate();
    },
    [isOnline, deleteMutation, refreshPendingCount, utils]
  );

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
