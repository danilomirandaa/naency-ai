'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DeleteDialog } from '@/components/ui/DeleteDialog';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { categoriesQuery } from '@/features/categories/api/categories.queries';
import {
  createTransactionAction,
  deleteTransactionAction,
  setTransactionStatusAction,
  updateTransactionAction,
} from '@/features/transactions/actions';
import { transactionsQuery } from '@/features/transactions/api/transactions.queries';
import { TransactionFormDialog } from '@/features/transactions/components/TransactionFormDialog';
import { TransactionsFilters } from '@/features/transactions/components/TransactionsFilters';
import { TransactionsList } from '@/features/transactions/components/TransactionsList';
import { TransactionsSummary } from '@/features/transactions/components/TransactionsSummary';
import {
  type TransactionFilters,
  filtersFromSearchParams,
  filtersToSearchParams,
} from '@/features/transactions/filters';
import type { TransactionItem } from '@/features/transactions/types';
import type { TransactionKind } from '@/lib/transactions';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

export type TransactionsScreenProps = {
  workspaceId: string;
  canEdit: boolean;
  /** Tipo fixado pela rota (/transacoes/receitas…); `null` mostra todos. */
  kind: TransactionKind | null;
  title: string;
  today: string;
};

type DialogState = { mode: 'create' } | { mode: 'edit'; transaction: TransactionItem } | null;

/** Container: filtros na URL, queries e actions ligados aos componentes. */
export function TransactionsScreen({ workspaceId, canEdit, kind, title, today }: TransactionsScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const filters = filtersFromSearchParams(searchParams, { kind });

  const page = useQuery(transactionsQuery.options(workspaceId, filters));
  const accounts = useQuery(accountsQuery.options(workspaceId, { includeArchived: true }));
  const categories = useQuery(categoriesQuery.options(workspaceId, { includeArchived: false }));

  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [deleting, setDeleting] = React.useState<TransactionItem | null>(null);
  const [actionFailed, setActionFailed] = React.useState(false);

  const changeFilters = (changes: Partial<TransactionFilters>) => {
    const next = { ...filters, page: 1, ...changes };
    const query = filtersToSearchParams(next, { omitKind: true }).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: transactionsQuery.all(workspaceId) }),
      queryClient.invalidateQueries({ queryKey: accountsQuery.all(workspaceId) }),
    ]);
  };

  const editing = dialog?.mode === 'edit' ? dialog.transaction : null;
  const formAction = React.useMemo(
    () =>
      editing
        ? updateTransactionAction.bind(null, workspaceId, editing.id)
        : createTransactionAction.bind(null, workspaceId),
    [editing, workspaceId],
  );

  const accountOptions = accounts.data ?? [];
  const isFiltered = Boolean(filters.accountId || filters.categoryId || filters.search);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader
        title={title}
        description="Receitas, despesas e transferências de todas as contas."
        actions={
          canEdit ? (
            <Button onClick={() => setDialog({ mode: 'create' })}>
              <Icon icon="add" data-icon="inline-start" />
              Novo lançamento
            </Button>
          ) : undefined
        }
      />
      <TransactionsFilters
        filters={filters}
        onChange={changeFilters}
        accounts={accountOptions}
        categories={categories.data ?? []}
      />
      {kind !== 'transfer' && (
        <TransactionsSummary
          incomeCents={page.data?.totals.incomeCents ?? 0}
          expenseCents={page.data?.totals.expenseCents ?? 0}
          isLoading={page.isPending}
        />
      )}
      {actionFailed && (
        <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
          Não foi possível alterar o lançamento. Atualize a página e tente de novo.
        </Panel.Callout>
      )}
      <TransactionsList
        items={page.data?.items ?? []}
        total={page.data?.total ?? 0}
        page={filters.page}
        pageSize={page.data?.pageSize ?? 50}
        onPageChange={(next) => changeFilters({ page: next })}
        isLoading={page.isPending}
        isError={page.isError}
        onRetry={() => void page.refetch()}
        isFiltered={isFiltered}
        canEdit={canEdit}
        onCreate={() => setDialog({ mode: 'create' })}
        onEdit={(transaction) => setDialog({ mode: 'edit', transaction })}
        onDelete={setDeleting}
        onStatusChange={async (transaction, status) => {
          const { ok } = await setTransactionStatusAction(workspaceId, transaction.id, status);
          setActionFailed(!ok);
          await refresh();
        }}
      />
      {canEdit && (
        <>
          <TransactionFormDialog
            open={dialog !== null}
            onOpenChange={(open) => !open && setDialog(null)}
            transaction={editing}
            defaultKind={kind ?? 'expense'}
            defaultAccountId={filters.accountId}
            accounts={accountOptions}
            categories={categories.data ?? []}
            action={formAction}
            onSaved={() => void refresh()}
            today={today}
          />
          <DeleteDialog
            open={deleting !== null}
            onClose={() => setDeleting(null)}
            title="Excluir lançamento"
            subtitle={
              deleting?.kind === 'transfer'
                ? `"${deleting.description}" sai das duas contas da transferência.`
                : `"${deleting?.description ?? ''}" sai da lista e do saldo.`
            }
            onConfirm={async () => {
              if (!deleting) {
                return;
              }
              const { ok } = await deleteTransactionAction(workspaceId, deleting.id);
              setActionFailed(!ok);
              setDeleting(null);
              await refresh();
            }}
          />
        </>
      )}
    </div>
  );
}
