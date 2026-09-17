import { DASHBOARD_BLOCKS, dashboardQuery } from '@/features/dashboard/api/dashboard.queries';
import { DashboardScreen } from '@/features/dashboard/containers/DashboardScreen';
import { currentMonth, isMonth, monthRange, todayIsoDate } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { makeQueryClient } from '@/lib/query-client';
import { loadDashboardBlock } from '@/server/dal/dashboard-blocks';
import { getActiveWorkspace } from '@/server/dal/workspaces';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Visão geral · Naency',
};

export default async function OverviewPage({ searchParams }: PageProps<'/'>) {
  const [{ active }, { mes }] = await Promise.all([getActiveWorkspace(), searchParams]);
  if (!active) {
    redirect('/comecar');
  }
  const month = typeof mes === 'string' && isMonth(mes) ? mes : currentMonth();

  const queryClient = makeQueryClient();
  // Cada bloco carrega e falha sozinho: um erro não derruba a página.
  await Promise.allSettled(
    DASHBOARD_BLOCKS.filter((block) => block !== 'evolucao-anual').map((block) =>
      queryClient.prefetchQuery({
        ...dashboardQuery.block(active.id, block, monthRange(month)),
        queryFn: () => loadDashboardBlock(active.id, block, monthRange(month)),
      }),
    ),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardScreen
        workspaceId={active.id}
        workspaceName={active.name}
        canEdit={can(active.role, 'finance.write')}
        today={todayIsoDate()}
      />
    </HydrationBoundary>
  );
}
