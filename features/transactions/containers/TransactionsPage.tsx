import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { categoriesQuery } from '@/features/categories/api/categories.queries';
import { transactionsQuery } from '@/features/transactions/api/transactions.queries';
import { TransactionsScreen } from '@/features/transactions/containers/TransactionsScreen';
import { filtersFromSearchParams } from '@/features/transactions/filters';
import { todayIsoDate } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { makeQueryClient } from '@/lib/query-client';
import type { TransactionKind } from '@/lib/transactions';
import { listAccounts } from '@/server/dal/accounts';
import { listCategories } from '@/server/dal/categories';
import { listTransactions } from '@/server/dal/transactions';
import { getActiveWorkspace } from '@/server/dal/workspaces';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

type SearchParams = Record<string, string | string[] | undefined>;

/** Página de lançamentos compartilhada pelas rotas /transacoes/*. Só compõe. */
export async function TransactionsPage({
  kind,
  title,
  searchParams,
}: {
  kind: TransactionKind | null;
  title: string;
  searchParams: Promise<SearchParams>;
}) {
  const [{ active }, rawParams] = await Promise.all([getActiveWorkspace(), searchParams]);
  if (!active) {
    redirect('/comecar');
  }
  const params = new URLSearchParams(
    Object.entries(rawParams).flatMap(([key, value]) =>
      typeof value === 'string' ? [[key, value]] : [],
    ),
  );
  const filters = filtersFromSearchParams(params, { kind });

  const queryClient = makeQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      ...transactionsQuery.options(active.id, filters),
      queryFn: () => listTransactions(active.id, filters),
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
      <TransactionsScreen
        workspaceId={active.id}
        canEdit={can(active.role, 'finance.write')}
        kind={kind}
        title={title}
        today={todayIsoDate()}
      />
    </HydrationBoundary>
  );
}
