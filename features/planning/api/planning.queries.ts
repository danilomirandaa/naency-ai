import type { BudgetLine, GoalSummary } from '@/features/planning/types';
import { fetchJson } from '@/lib/api/fetch-json';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';

export const planningQuery = {
  budgetsAll: (workspaceId: string) => ['workspace', workspaceId, 'budgets'] as const,
  budgets: (workspaceId: string, month: string) =>
    queryOptions({
      queryKey: [...planningQuery.budgetsAll(workspaceId), month] as const,
      queryFn: () => fetchJson<BudgetLine[]>(`/api/workspaces/${workspaceId}/budgets`, { mes: month }),
      placeholderData: keepPreviousData,
    }),
  goalsAll: (workspaceId: string) => ['workspace', workspaceId, 'goals'] as const,
  goals: (workspaceId: string) =>
    queryOptions({
      queryKey: [...planningQuery.goalsAll(workspaceId), 'list'] as const,
      queryFn: () => fetchJson<GoalSummary[]>(`/api/workspaces/${workspaceId}/goals`),
    }),
};
