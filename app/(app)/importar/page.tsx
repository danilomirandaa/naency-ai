import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { categoriesQuery } from '@/features/categories/api/categories.queries';
import { ImportScreen } from '@/features/imports/containers/ImportScreen';
import { can } from '@/lib/permissions';
import { makeQueryClient } from '@/lib/query-client';
import { getAiConfig } from '@/server/ai/config';
import { listAccounts } from '@/server/dal/accounts';
import { listCategories } from '@/server/dal/categories';
import { getActiveWorkspace } from '@/server/dal/workspaces';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Importar extrato · Naency',
};

export default async function ImportPage() {
  const { active } = await getActiveWorkspace();
  if (!active) {
    redirect('/comecar');
  }
  const queryClient = makeQueryClient();
  await Promise.all([
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
      <ImportScreen workspaceId={active.id} canImport={can(active.role, 'import.run')} aiEnabled={getAiConfig().enabled} />
    </HydrationBoundary>
  );
}
