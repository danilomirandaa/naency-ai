import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { categoriesQuery } from '@/features/categories/api/categories.queries';
import { recurringQuery } from '@/features/recurring/api/recurring.queries';
import { RecurringScreen } from '@/features/recurring/containers/RecurringScreen';
import { todayIsoDate } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { makeQueryClient } from '@/lib/query-client';
import { listAccounts } from '@/server/dal/accounts';
import { listCategories } from '@/server/dal/categories';
import { listRecurringRules } from '@/server/dal/recurring';
import { getActiveWorkspace } from '@/server/dal/workspaces';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Recorrentes · Naency',
};

export default async function RecurringPage() {
  const { active } = await getActiveWorkspace();
  if (!active) {
    redirect('/comecar');
  }
  const queryClient = makeQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({ ...recurringQuery.list(active.id), queryFn: () => listRecurringRules(active.id) }),
    queryClient.prefetchQuery({
      ...accountsQuery.options(active.id, { includeArchived: true }),
      queryFn: () => listAccounts(active.id, { includeArchived: true }),
    }),
    queryClient.prefetchQuery({
      ...categoriesQuery.options(active.id, { includeArchived: false }),
      queryFn: () => listCategories(active.id),
    }),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecurringScreen workspaceId={active.id} canEdit={can(active.role, 'finance.write')} today={todayIsoDate()} />
    </HydrationBoundary>
  );
}
