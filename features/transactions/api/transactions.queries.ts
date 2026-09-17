import { type TransactionFilters, filtersToSearchParams } from '@/features/transactions/filters';
import type { TransactionsPage } from '@/features/transactions/types';
import { fetchJson } from '@/lib/api/fetch-json';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';

/** Contrato de query dos lançamentos (docs/architecture.md). */
export const transactionsQuery = {
  all: (workspaceId: string) => ['workspace', workspaceId, 'transactions'] as const,
  key: (workspaceId: string, filters: TransactionFilters) =>
    [...transactionsQuery.all(workspaceId), filters] as const,
  options: (workspaceId: string, filters: TransactionFilters) =>
    queryOptions({
      queryKey: transactionsQuery.key(workspaceId, filters),
      queryFn: () => {
        // Mês sempre explícito na API: o "mês atual" do cliente e do servidor podem diferir.
        const params = Object.fromEntries(filtersToSearchParams(filters));
        return fetchJson<TransactionsPage>(`/api/workspaces/${workspaceId}/transactions`, {
          ...params,
          mes: filters.month,
        });
      },
      // Trocar de filtro mantém a lista anterior na tela até a nova chegar.
      placeholderData: keepPreviousData,
    }),
};
