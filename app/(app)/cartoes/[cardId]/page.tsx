import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { cardsQuery } from '@/features/cards/api/cards.queries';
import { CardInvoiceScreen } from '@/features/cards/containers/CardInvoiceScreen';
import { categoriesQuery } from '@/features/categories/api/categories.queries';
import { todayIsoDate } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { makeQueryClient } from '@/lib/query-client';
import { listAccounts } from '@/server/dal/accounts';
import { listCardInvoices, listCards } from '@/server/dal/cards';
import { listCategories } from '@/server/dal/categories';
import { getActiveWorkspace } from '@/server/dal/workspaces';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Fatura · Naency',
};

export default async function CardPage({ params }: PageProps<'/cartoes/[cardId]'>) {
  const [{ active }, { cardId }] = await Promise.all([getActiveWorkspace(), params]);
  if (!active) {
    redirect('/comecar');
  }
  const cards = await listCards(active.id, { includeArchived: true });
  const card = cards.find((item) => item.id === cardId);
  if (!card) {
    notFound();
  }

  const queryClient = makeQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      ...cardsQuery.invoices(active.id, card.id),
      queryFn: () => listCardInvoices(active.id, card.id),
    }),
    queryClient.prefetchQuery({
      ...accountsQuery.options(active.id, { includeArchived: false }),
      queryFn: () => listAccounts(active.id),
    }),
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
      <CardInvoiceScreen
        workspaceId={active.id}
        card={{ id: card.id, name: card.name, defaultPaymentAccountId: card.defaultPaymentAccountId }}
        canEdit={can(active.role, 'finance.write')}
        today={todayIsoDate()}
      />
    </HydrationBoundary>
  );
}
