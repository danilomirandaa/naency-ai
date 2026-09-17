'use client';

import { DeleteDialog } from '@/components/ui/DeleteDialog';
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
import { TransactionsList } from '@/features/transactions/components/TransactionsList';
import { TransactionsTable, type TransactionsTableProps } from '@/features/transactions/components/TransactionsTable';
import type { TransactionFilters, TransactionSort } from '@/features/transactions/filters';
import type { TransactionItem, TransactionsPage } from '@/features/transactions/types';
import type { TransactionKind } from '@/lib/transactions';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

export type TransactionsManagerProps = {
  workspaceId: string;
  canEdit: boolean;
  filters: TransactionFilters;
  onPageChange: (page: number) => void;
  onSortChange: (sort: TransactionSort | null) => void;
  isFiltered: boolean;
  defaultKind: TransactionKind;
  today: string;
  /** Chaves extras a invalidar depois de uma escrita (ex.: faturas). */
  extraInvalidations?: readonly (readonly unknown[])[];
  hiddenColumns?: TransactionsTableProps['hiddenColumns'];
  /** Recebe a página carregada (resumo, cabeçalhos). */
  children?: (state: {
    page: TransactionsPage | undefined;
    isPending: boolean;
    openCreate: () => void;
  }) => React.ReactNode;
};

type DialogState = { mode: 'create' } | { mode: 'edit'; transaction: TransactionItem } | null;

/**
 * Container: lista de lançamentos de um filtro com criar, editar, excluir e
 * efetivar. Usado pela página de transações e pela fatura do cartão.
 */
export function TransactionsManager({
  workspaceId,
  canEdit,
  filters,
  onPageChange,
  onSortChange,
  isFiltered,
  defaultKind,
  today,
  extraInvalidations = [],
  hiddenColumns,
  children,
}: TransactionsManagerProps) {
  const queryClient = useQueryClient();
  const page = useQuery(transactionsQuery.options(workspaceId, filters));
  const accounts = useQuery(accountsQuery.options(workspaceId, { includeArchived: true }));
  const categories = useQuery(categoriesQuery.options(workspaceId, { includeArchived: false }));

  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [deleting, setDeleting] = React.useState<TransactionItem | null>(null);
  const [actionFailed, setActionFailed] = React.useState(false);

  const refresh = async () => {
    await Promise.all(
      [transactionsQuery.all(workspaceId), accountsQuery.all(workspaceId), ...extraInvalidations].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
  };

  const editing = dialog?.mode === 'edit' ? dialog.transaction : null;
  const formAction = React.useMemo(
    () =>
      editing
        ? updateTransactionAction.bind(null, workspaceId, editing.id)
        : createTransactionAction.bind(null, workspaceId),
    [editing, workspaceId],
  );
  const openCreate = () => setDialog({ mode: 'create' });
  const rowHandlers = {
    onEdit: (transaction: TransactionItem) => setDialog({ mode: 'edit', transaction }),
    // Excluir sempre passa pelo DeleteDialog abaixo.
    onDelete: setDeleting,
    onStatusChange: async (transaction: TransactionItem, status: 'cleared' | 'planned') => {
      const { ok } = await setTransactionStatusAction(workspaceId, transaction.id, status);
      setActionFailed(!ok);
      await refresh();
    },
  };

  return (
    <>
      {children?.({ page: page.data, isPending: page.isPending, openCreate })}
      {actionFailed && (
        <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
          Não foi possível alterar o lançamento. Atualize a página e tente de novo.
        </Panel.Callout>
      )}
      {/* Tabela no desktop; no celular, a lista por dia. A que não cabe some com display:none. */}
      <div className="hidden md:block">
        <TransactionsTable
          items={page.data?.items ?? []}
          today={today}
          total={page.data?.total ?? 0}
          page={filters.page}
          pageSize={page.data?.pageSize ?? 50}
          onPageChange={onPageChange}
          sort={filters.sort ?? null}
          onSortChange={onSortChange}
          isLoading={page.isPending}
          isError={page.isError}
          emptyMessage={isFiltered ? 'Nada encontrado com esses filtros' : 'Nenhum lançamento neste período'}
          emptyDescription={
            canEdit && !isFiltered ? 'Lance receitas, despesas e transferências para acompanhar os saldos.' : undefined
          }
          canEdit={canEdit}
          hiddenColumns={hiddenColumns}
          {...rowHandlers}
        />
      </div>
      <div className="md:hidden">
        <TransactionsList
          items={page.data?.items ?? []}
          today={today}
          total={page.data?.total ?? 0}
          page={filters.page}
          pageSize={page.data?.pageSize ?? 50}
          onPageChange={onPageChange}
          isLoading={page.isPending}
          isError={page.isError}
          onRetry={() => void page.refetch()}
          isFiltered={isFiltered}
          canEdit={canEdit}
          onCreate={openCreate}
          {...rowHandlers}
        />
      </div>
      {canEdit && (
        <>
          <TransactionFormDialog
            open={dialog !== null}
            onOpenChange={(open) => !open && setDialog(null)}
            transaction={editing}
            defaultKind={defaultKind}
            defaultAccountId={filters.accountId}
            accounts={accounts.data ?? []}
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
              deleting?.installment
                ? `"${deleting.description}" é uma parcela: a compra inteira (${deleting.installment.total} parcelas) será excluída.`
                : deleting?.kind === 'transfer'
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
    </>
  );
}
