import { dashboardQuery } from '@/features/dashboard/api/dashboard.queries';
import { ReportsScreen, rangeFromParams } from '@/features/reports/containers/ReportsScreen';
import { todayIsoDate } from '@/lib/dates';
import { makeQueryClient } from '@/lib/query-client';
import { loadDashboardBlock } from '@/server/dal/dashboard-blocks';
import { getActiveWorkspace } from '@/server/dal/workspaces';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Relatórios · Naency',
};

export default async function ReportsPage({ searchParams }: PageProps<'/relatorios'>) {
  const [{ active }, raw] = await Promise.all([getActiveWorkspace(), searchParams]);
  if (!active) {
    redirect('/comecar');
  }
  const range = rangeFromParams({ get: (name) => (typeof raw[name] === 'string' ? (raw[name] as string) : null) });
  const queryClient = makeQueryClient();
  await Promise.allSettled(
    (['resultado', 'categorias', 'evolucao-anual'] as const).map((block) =>
      queryClient.prefetchQuery({
        ...dashboardQuery.block(active.id, block, range),
        queryFn: () => loadDashboardBlock(active.id, block, range),
      }),
    ),
  );
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReportsScreen workspaceId={active.id} today={todayIsoDate()} />
    </HydrationBoundary>
  );
}
