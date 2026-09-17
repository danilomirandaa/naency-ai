import type { AccountSummary } from '@/features/accounts/types';
import { fetchJson } from '@/lib/api/fetch-json';
import { queryOptions } from '@tanstack/react-query';

export type AccountsFilters = { includeArchived: boolean };

/** Contrato de query das contas (docs/architecture.md): servidor e cliente usam o mesmo. */
export const accountsQuery = {
  /** Prefixo de tudo que é conta no espaço: invalide este depois de uma escrita. */
  all: (workspaceId: string) => ['workspace', workspaceId, 'accounts'] as const,
  key: (workspaceId: string, filters: AccountsFilters) =>
    [...accountsQuery.all(workspaceId), filters] as const,
  options: (workspaceId: string, filters: AccountsFilters) =>
    queryOptions({
      queryKey: accountsQuery.key(workspaceId, filters),
      queryFn: () =>
        fetchJson<AccountSummary[]>(`/api/workspaces/${workspaceId}/accounts`, {
          arquivadas: filters.includeArchived,
        }),
    }),
};
