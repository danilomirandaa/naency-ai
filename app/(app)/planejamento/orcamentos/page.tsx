import { planningQuery } from '@/features/planning/api/planning.queries';
import { BudgetsScreen } from '@/features/planning/containers/BudgetsScreen';
import { currentMonth, isMonth } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { makeQueryClient } from '@/lib/query-client';
import { listBudgets } from '@/server/dal/planning';
import { getActiveWorkspace } from '@/server/dal/workspaces';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Orçamentos · Naency',
};

export default async function BudgetsPage({ searchParams }: PageProps<'/planejamento/orcamentos'>) {
  const [{ active }, { mes }] = await Promise.all([getActiveWorkspace(), searchParams]);
  if (!active) {
    redirect('/comecar');
  }
  const month = typeof mes === 'string' && isMonth(mes) ? mes : currentMonth();
  const queryClient = makeQueryClient();
  await queryClient.prefetchQuery({ ...planningQuery.budgets(active.id, month), queryFn: () => listBudgets(active.id, month) });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BudgetsScreen workspaceId={active.id} canEdit={can(active.role, 'finance.write')} />
    </HydrationBoundary>
  );
}
