'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { categoriesQuery } from '@/features/categories/api/categories.queries';
import { TransactionsFilters } from '@/features/transactions/components/TransactionsFilters';
import { TransactionsSummary } from '@/features/transactions/components/TransactionsSummary';
import { TransactionsManager } from '@/features/transactions/containers/TransactionsManager';
import {
  type TransactionFilters,
  filtersFromSearchParams,
  filtersToSearchParams,
} from '@/features/transactions/filters';
import type { TransactionsPage } from '@/features/transactions/types';
import type { TransactionKind } from '@/lib/transactions';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type TransactionsScreenProps = {
  workspaceId: string;
  canEdit: boolean;
  /** Tipo fixado pela rota (/transacoes/receitas…); `null` mostra todos. */
  kind: TransactionKind | null;
  title: string;
  today: string;
  /** Cookie do período global (header). */
  periodCookie: string | null;
};

const EMPTY_TOTALS: TransactionsPage['totals'] = {
  incomeCents: 0,
  expenseCents: 0,
  pending: { cents: 0, count: 0 },
  paid: { cents: 0, count: 0 },
};

/** Container: filtros na URL em volta do TransactionsManager. */
export function TransactionsScreen({ workspaceId, canEdit, kind, title, today, periodCookie }: TransactionsScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = filtersFromSearchParams(searchParams, { kind, periodCookie });
  const accounts = useQuery(accountsQuery.options(workspaceId, { includeArchived: true }));
  const categories = useQuery(categoriesQuery.options(workspaceId, { includeArchived: false }));

  const changeFilters = (changes: Partial<TransactionFilters>) => {
    const next = { ...filters, page: 1, ...changes };
    const query = filtersToSearchParams(next, { omitKind: true }).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <TransactionsManager
        workspaceId={workspaceId}
        canEdit={canEdit}
        filters={filters}
        onPageChange={(page) => changeFilters({ page })}
        onSortChange={(sort) => changeFilters({ sort })}
        isFiltered={Boolean(filters.accountId || filters.categoryId || filters.search || filters.situation)}
        defaultKind={kind ?? 'expense'}
        today={today}
      >
        {({ page, isPending, openCreate }) => (
          <>
            <PageHeader
              title={title}
              description="Receitas, despesas e transferências de todas as contas."
              actions={
                canEdit ? (
                  <Button onClick={openCreate}>
                    <Icon icon="add" data-icon="inline-start" />
                    Novo lançamento
                  </Button>
                ) : undefined
              }
            />
            {kind !== 'transfer' && (
              <TransactionsSummary kind={kind} totals={page?.totals ?? EMPTY_TOTALS} isLoading={isPending} />
            )}
            <TransactionsFilters
              filters={filters}
              onChange={changeFilters}
              accounts={accounts.data ?? []}
              categories={categories.data ?? []}
              overdueCount={page?.overdueCount ?? 0}
            />
          </>
        )}
      </TransactionsManager>
    </div>
  );
}
