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
};

/** Container: filtros na URL em volta do TransactionsManager. */
export function TransactionsScreen({ workspaceId, canEdit, kind, title, today }: TransactionsScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = filtersFromSearchParams(searchParams, { kind });
  const accounts = useQuery(accountsQuery.options(workspaceId, { includeArchived: true }));
  const categories = useQuery(categoriesQuery.options(workspaceId, { includeArchived: false }));

  const changeFilters = (changes: Partial<TransactionFilters>) => {
    const next = { ...filters, page: 1, ...changes };
    const query = filtersToSearchParams(next, { omitKind: true }).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <TransactionsManager
        workspaceId={workspaceId}
        canEdit={canEdit}
        filters={filters}
        onPageChange={(page) => changeFilters({ page })}
        isFiltered={Boolean(filters.accountId || filters.categoryId || filters.search)}
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
            <TransactionsFilters
              filters={filters}
              onChange={changeFilters}
              accounts={accounts.data ?? []}
              categories={categories.data ?? []}
              today={today}
            />
            {kind !== 'transfer' && (
              <TransactionsSummary
                incomeCents={page?.totals.incomeCents ?? 0}
                expenseCents={page?.totals.expenseCents ?? 0}
                isLoading={isPending}
              />
            )}
          </>
        )}
      </TransactionsManager>
    </div>
  );
}
