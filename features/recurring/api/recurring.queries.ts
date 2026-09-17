import type { RecurringRuleSummary } from '@/features/recurring/types';
import { fetchJson } from '@/lib/api/fetch-json';
import { queryOptions } from '@tanstack/react-query';

export const recurringQuery = {
  all: (workspaceId: string) => ['workspace', workspaceId, 'recurring'] as const,
  list: (workspaceId: string) =>
    queryOptions({
      queryKey: [...recurringQuery.all(workspaceId), 'list'] as const,
      queryFn: () => fetchJson<RecurringRuleSummary[]>(`/api/workspaces/${workspaceId}/recurring`),
    }),
};
