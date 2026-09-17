import type {
  BalanceData,
  CategorySlice,
  EvolutionPoint,
  MonthResultData,
  RecentTransaction,
  SetupProgress,
  UpcomingItem,
} from '@/features/dashboard/types';
import { fetchJson } from '@/lib/api/fetch-json';
import type { DateRange } from '@/lib/periods';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';

export type DashboardBlocks = {
  resultado: MonthResultData;
  categorias: CategorySlice[];
  evolucao: EvolutionPoint[];
  'evolucao-anual': EvolutionPoint[];
  'a-vencer': UpcomingItem[];
  saldos: BalanceData;
  recentes: RecentTransaction[];
  configuracao: SetupProgress;
};

export type DashboardBlock = keyof DashboardBlocks;

export const DASHBOARD_BLOCKS: DashboardBlock[] = [
  'resultado',
  'categorias',
  'evolucao',
  'evolucao-anual',
  'a-vencer',
  'saldos',
  'recentes',
  'configuracao',
];

/** Contrato de query do dashboard: um bloco por query, para carregar e falhar separado. */
export const dashboardQuery = {
  all: (workspaceId: string) => ['workspace', workspaceId, 'dashboard'] as const,
  block: <B extends DashboardBlock>(workspaceId: string, block: B, range: DateRange) =>
    queryOptions({
      queryKey: [...dashboardQuery.all(workspaceId), block, range.from, range.to] as const,
      queryFn: () =>
        fetchJson<DashboardBlocks[B]>(`/api/workspaces/${workspaceId}/dashboard/${block}`, { de: range.from, ate: range.to }),
      placeholderData: keepPreviousData,
    }),
};
