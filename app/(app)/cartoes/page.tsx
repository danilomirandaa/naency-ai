import { cardsQuery } from '@/features/cards/api/cards.queries';
import { CardsScreen } from '@/features/cards/containers/CardsScreen';
import { can } from '@/lib/permissions';
import { makeQueryClient } from '@/lib/query-client';
import { listCards } from '@/server/dal/cards';
import { getActiveWorkspace } from '@/server/dal/workspaces';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Cartões · Naency',
};

export default async function CardsPage() {
  const { active } = await getActiveWorkspace();
  if (!active) {
    redirect('/comecar');
  }
  const queryClient = makeQueryClient();
  await queryClient.prefetchQuery({
    ...cardsQuery.list(active.id),
    queryFn: () => listCards(active.id),
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CardsScreen workspaceId={active.id} canEdit={can(active.role, 'finance.write')} />
    </HydrationBoundary>
  );
}
