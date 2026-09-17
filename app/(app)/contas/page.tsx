import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { AccountsScreen } from '@/features/accounts/containers/AccountsScreen';
import { todayIsoDate } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { makeQueryClient } from '@/lib/query-client';
import { listAccounts, listInstitutions } from '@/server/dal/accounts';
import { getActiveWorkspace } from '@/server/dal/workspaces';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Contas · Naency',
};

export default async function AccountsPage({ searchParams }: PageProps<'/contas'>) {
  const [{ active }, { nova }] = await Promise.all([getActiveWorkspace(), searchParams]);
  if (!active) {
    redirect('/comecar');
  }
  const canEdit = can(active.role, 'finance.write');

  const queryClient = makeQueryClient();
  const [institutions] = await Promise.all([
    canEdit ? listInstitutions(active.id) : Promise.resolve([]),
    queryClient.prefetchQuery({
      ...accountsQuery.options(active.id, { includeArchived: true }),
      queryFn: () => listAccounts(active.id, { includeArchived: true }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AccountsScreen
        workspaceId={active.id}
        workspaceName={active.name}
        canEdit={canEdit}
        institutions={institutions}
        today={todayIsoDate()}
        startCreating={nova === 'cartao' ? 'card' : nova === '1' ? 'account' : null}
      />
    </HydrationBoundary>
  );
}
