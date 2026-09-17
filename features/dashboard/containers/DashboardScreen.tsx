'use client';

import { MonthPicker } from '@/components/finance/MonthPicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { dashboardQuery } from '@/features/dashboard/api/dashboard.queries';
import { BalanceOverview } from '@/features/dashboard/components/BalanceOverview';
import { CategoryBreakdown } from '@/features/dashboard/components/CategoryBreakdown';
import { MonthResult } from '@/features/dashboard/components/MonthResult';
import { MonthlyEvolution } from '@/features/dashboard/components/MonthlyEvolution';
import { RecentTransactions } from '@/features/dashboard/components/RecentTransactions';
import { SetupChecklist } from '@/features/dashboard/components/SetupChecklist';
import { UpcomingBills } from '@/features/dashboard/components/UpcomingBills';
import { currentMonth, isMonth, monthRange } from '@/lib/dates';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type DashboardScreenProps = {
  workspaceId: string;
  workspaceName: string;
  canEdit: boolean;
  today: string;
};

/** Container: seletor de mês na URL e uma query por bloco. */
export function DashboardScreen({ workspaceId, workspaceName, canEdit, today }: DashboardScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get('mes');
  const month = isMonth(requested) ? requested : currentMonth();
  const range = monthRange(month);

  const result = useQuery(dashboardQuery.block(workspaceId, 'resultado', range));
  const categories = useQuery(dashboardQuery.block(workspaceId, 'categorias', range));
  const evolution = useQuery(dashboardQuery.block(workspaceId, 'evolucao', range));
  const upcoming = useQuery(dashboardQuery.block(workspaceId, 'a-vencer', range));
  const balances = useQuery(dashboardQuery.block(workspaceId, 'saldos', range));
  const recent = useQuery(dashboardQuery.block(workspaceId, 'recentes', range));
  const setup = useQuery(dashboardQuery.block(workspaceId, 'configuracao', range));

  const changeMonth = (next: string) => {
    router.replace(next === currentMonth() ? pathname : `${pathname}?mes=${next}`, { scroll: false });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <PageHeader
        title="Visão geral"
        description={workspaceName}
        actions={<MonthPicker value={month} onValueChange={changeMonth} />}
      />
      <SetupChecklist progress={setup.data} canEdit={canEdit} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <MonthResult data={result.data} isLoading={result.isPending} isError={result.isError} />
          <div className="grid gap-4 md:grid-cols-2">
            <CategoryBreakdown
              data={categories.data}
              isLoading={categories.isPending}
              isError={categories.isError}
              transactionsHref={(categoryId) =>
                categoryId
                  ? `/transacoes/despesas?mes=${month}&categoria=${categoryId}`
                  : `/transacoes/despesas?mes=${month}`
              }
            />
            <MonthlyEvolution data={evolution.data} isLoading={evolution.isPending} isError={evolution.isError} />
          </div>
          <RecentTransactions data={recent.data} isLoading={recent.isPending} isError={recent.isError} />
        </div>
        <div className="flex flex-col gap-4">
          <BalanceOverview data={balances.data} isLoading={balances.isPending} isError={balances.isError} />
          <UpcomingBills data={upcoming.data} today={today} isLoading={upcoming.isPending} isError={upcoming.isError} />
        </div>
      </div>
    </div>
  );
}
