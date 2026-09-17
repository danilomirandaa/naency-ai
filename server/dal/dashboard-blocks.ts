import 'server-only';
import type { DashboardBlock, DashboardBlocks } from '@/features/dashboard/api/dashboard.queries';
import type { DateRange } from '@/lib/periods';
import {
  getBalances,
  getCategoryBreakdown,
  getPeriodResult,
  getMonthlyEvolution,
  getRecentTransactions,
  getSetupProgress,
  getUpcoming,
} from '@/server/dal/dashboard';

/** Leitura de um bloco do dashboard pelo nome usado na URL. */
export function loadDashboardBlock<B extends DashboardBlock>(
  workspaceId: string,
  block: B,
  range: DateRange,
): Promise<DashboardBlocks[B]> {
  // A evolução termina no mês do fim do período.
  const month = range.to.slice(0, 7);
  const loaders: { [K in DashboardBlock]: () => Promise<DashboardBlocks[K]> } = {
    resultado: () => getPeriodResult(workspaceId, range),
    categorias: () => getCategoryBreakdown(workspaceId, range),
    evolucao: () => getMonthlyEvolution(workspaceId, month),
    'evolucao-anual': () => getMonthlyEvolution(workspaceId, month, 12),
    'a-vencer': () => getUpcoming(workspaceId),
    saldos: () => getBalances(workspaceId),
    recentes: () => getRecentTransactions(workspaceId),
    configuracao: () => getSetupProgress(workspaceId),
  };
  return loaders[block]() as Promise<DashboardBlocks[B]>;
}
