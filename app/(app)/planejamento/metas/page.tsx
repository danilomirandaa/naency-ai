import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { planningQuery } from '@/features/planning/api/planning.queries';
import { GoalsScreen } from '@/features/planning/containers/GoalsScreen';
import { can } from '@/lib/permissions';
import { makeQueryClient } from '@/lib/query-client';
import { listAccounts } from '@/server/dal/accounts';
import { listGoals } from '@/server/dal/planning';
import { getActiveWorkspace } from '@/server/dal/workspaces';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Metas · Naency',
};

export default async function GoalsPage() {
  const { active } = await getActiveWorkspace();
  if (!active) {
    redirect('/comecar');
  }
  const queryClient = makeQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({ ...planningQuery.goals(active.id), queryFn: () => listGoals(active.id) }),
    queryClient.prefetchQuery({
      ...accountsQuery.options(active.id, { includeArchived: false }),
      queryFn: () => listAccounts(active.id),
    }),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GoalsScreen workspaceId={active.id} canEdit={can(active.role, 'finance.write')} />
    </HydrationBoundary>
  );
}
