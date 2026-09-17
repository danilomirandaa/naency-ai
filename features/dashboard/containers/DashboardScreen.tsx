'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { dashboardQuery } from '@/features/dashboard/api/dashboard.queries';
import { BalanceOverview } from '@/features/dashboard/components/BalanceOverview';
import { CategoryBreakdown } from '@/features/dashboard/components/CategoryBreakdown';
import { MonthResult } from '@/features/dashboard/components/MonthResult';
import { MonthlyEvolution } from '@/features/dashboard/components/MonthlyEvolution';
import { RecentTransactions } from '@/features/dashboard/components/RecentTransactions';
import { SetupChecklist } from '@/features/dashboard/components/SetupChecklist';
import { UpcomingBills } from '@/features/dashboard/components/UpcomingBills';
import { rangeParams, resolveRange } from '@/lib/periods';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

export type DashboardScreenProps = {
  workspaceId: string;
  workspaceName: string;
  canEdit: boolean;
  today: string;
  /** Cookie do período global (header). */
  periodCookie: string | null;
};

/** Container: período do header (URL ou cookie) e uma query por bloco. */
export function DashboardScreen({ workspaceId, workspaceName, canEdit, today, periodCookie }: DashboardScreenProps) {
  const searchParams = useSearchParams();
  const range = resolveRange(searchParams, periodCookie);
  const periodQuery = new URLSearchParams(rangeParams(range)).toString();

  const result = useQuery(dashboardQuery.block(workspaceId, 'resultado', range));
  const categories = useQuery(dashboardQuery.block(workspaceId, 'categorias', range));
  const evolution = useQuery(dashboardQuery.block(workspaceId, 'evolucao', range));
  const upcoming = useQuery(dashboardQuery.block(workspaceId, 'a-vencer', range));
  const balances = useQuery(dashboardQuery.block(workspaceId, 'saldos', range));
  const recent = useQuery(dashboardQuery.block(workspaceId, 'recentes', range));
  const setup = useQuery(dashboardQuery.block(workspaceId, 'configuracao', range));


  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <PageHeader
        title="Visão geral"
        description={workspaceName}
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
                  ? `/transacoes/despesas?${periodQuery}&categoria=${categoryId}`
                  : `/transacoes/despesas?${periodQuery}`
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
