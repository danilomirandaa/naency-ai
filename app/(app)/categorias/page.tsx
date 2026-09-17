import { categoriesQuery } from '@/features/categories/api/categories.queries';
import { CategoriesScreen } from '@/features/categories/containers/CategoriesScreen';
import { can } from '@/lib/permissions';
import { makeQueryClient } from '@/lib/query-client';
import { listCategories } from '@/server/dal/categories';
import { getActiveWorkspace } from '@/server/dal/workspaces';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Categorias · Naency',
};

export default async function CategoriesPage() {
  const { active } = await getActiveWorkspace();
  if (!active) {
    redirect('/comecar');
  }

  const queryClient = makeQueryClient();
  await queryClient.prefetchQuery({
    ...categoriesQuery.options(active.id, { includeArchived: true }),
    queryFn: () => listCategories(active.id, { includeArchived: true }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CategoriesScreen workspaceId={active.id} canEdit={can(active.role, 'finance.write')} />
    </HydrationBoundary>
  );
}
