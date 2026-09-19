'use client';

import { useToast } from '@/components/ui/Toast';
import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { cardsQuery } from '@/features/cards/api/cards.queries';
import { importsQuery } from '@/features/imports/api/imports.queries';
import { notificationsQuery } from '@/features/notifications/api/notifications.queries';
import { finishedBatches, jobNotice, notifyOutsideTab } from '@/features/imports/jobs';
import type { ImportBatchSummary } from '@/features/imports/types';
import { transactionsQuery } from '@/features/transactions/api/transactions.queries';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

export type ImportJobsWatcherProps = { workspaceId: string };

/**
 * Acompanha as importações do espaço inteiro: o trabalho roda no servidor, então
 * o aviso precisa chegar mesmo que a pessoa tenha saído da tela de importação.
 * Só consulta enquanto existe lote processando.
 */
export function ImportJobsWatcher({ workspaceId }: ImportJobsWatcherProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    ...importsQuery.list(workspaceId),
    refetchInterval: (query) => (query.state.data?.some((batch) => batch.job) ? 3_000 : false),
    refetchOnWindowFocus: true,
  });
  const previous = React.useRef<ImportBatchSummary[]>([]);

  React.useEffect(() => {
    if (!data) {
      return;
    }
    const finished = finishedBatches(previous.current, data);
    previous.current = data;
    for (const batch of finished) {
      const notice = jobNotice(batch);
      toast({ title: notice.title, description: notice.description, variant: notice.variant });
      notifyOutsideTab(notice);
    }
    if (finished.length > 0) {
      // O sino lista o que aconteceu; atualiza junto com o aviso.
      void queryClient.invalidateQueries({ queryKey: notificationsQuery.all(workspaceId) });
    }
    if (finished.some((batch) => batch.status === 'committed')) {
      for (const queryKey of [
        transactionsQuery.all(workspaceId),
        accountsQuery.all(workspaceId),
        cardsQuery.all(workspaceId),
      ]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    }
  }, [data, toast, queryClient, workspaceId]);

  return null;
}
