'use client';

import { AccountAvatar } from '@/components/finance/AccountAvatar';
import { CategoryIcon } from '@/components/finance/CategoryIcon';
import { MoneyValue } from '@/components/finance/MoneyValue';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import type { PanelDataTableColumn, PanelDataTableSort } from '@/components/ui/Panel/types';
import { Text } from '@/components/ui/Text';
import { TransactionStatusBadge } from '@/features/transactions/components/TransactionStatusBadge';
import { TRANSACTION_SORT_KEYS, type TransactionSort, type TransactionSortKey } from '@/features/transactions/filters';
import type { TransactionItem } from '@/features/transactions/types';
import { formatIsoDate } from '@/lib/dates';
import { PAYMENT_METHOD_LABELS, transactionSituation } from '@/lib/transactions';

export type TransactionsTableProps = {
  items: TransactionItem[];
  /** "AAAA-MM-DD" de hoje, para marcar atrasados. */
  today: string;
  canEdit: boolean;
  onEdit: (transaction: TransactionItem) => void;
  onDelete: (transaction: TransactionItem) => void;
  onStatusChange: (transaction: TransactionItem, status: 'cleared' | 'planned') => Promise<void>;
  /** Ordem atual; `null` = mais recentes primeiro. */
  sort: TransactionSort | null;
  onSortChange: (sort: TransactionSort | null) => void;
  /** Paginação (página começa em 1). */
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  isError?: boolean;
  emptyMessage: string;
  emptyDescription?: string;
  /** Colunas que não fazem sentido na tela (ex.: situação na fatura do cartão). */
  hiddenColumns?: ('situation' | 'paymentMethod' | 'paidAt')[];
};

const PAID_LABEL = {
  expense: 'Marcar como paga',
  income: 'Marcar como recebida',
  transfer: 'Marcar como efetivada',
};
const PENDING_LABEL = {
  expense: 'Marcar como a pagar',
  income: 'Marcar como a receber',
  transfer: 'Marcar como prevista',
};

function isSortKey(key: string): key is TransactionSortKey {
  return (TRANSACTION_SORT_KEYS as readonly string[]).includes(key);
}

function RowActions({
  item,
  onEdit,
  onDelete,
  onStatusChange,
}: Pick<TransactionsTableProps, 'onEdit' | 'onDelete' | 'onStatusChange'> & {
  item: TransactionItem;
}) {
  const cleared = item.status === 'cleared';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${item.description}`}>
          <Icon icon="dots" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" variant="default">
        <DropdownMenuItem onSelect={() => onEdit(item)}>
          <Icon icon="edit" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void onStatusChange(item, cleared ? 'planned' : 'cleared')}>
          <Icon icon={cleared ? 'clock' : 'check'} />
          {cleared ? PENDING_LABEL[item.kind] : PAID_LABEL[item.kind]}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* A exclusão abre o DeleteDialog no container (docs/components.md, regra 8). */}
        <DropdownMenuItem
          onSelect={() => onDelete(item)}
          className="text-typography-status-critical-rest focus:text-typography-status-critical-rest"
        >
          <Icon icon="delete" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Muted() {
  return (
    <Text size="sm" color="secondary">
      <span aria-hidden>—</span>
      <span className="sr-only">Não informado</span>
    </Text>
  );
}

/**
 * Lançamentos em tabela: uma linha por lançamento, com situação, forma de
 * pagamento e ações. Atrasados ficam marcados na borda da linha. Colunas
 * ordenáveis mudam a ordem no servidor (a lista é paginada).
 */
export function TransactionsTable({
  items,
  today,
  canEdit,
  onEdit,
  onDelete,
  onStatusChange,
  sort,
  onSortChange,
  page,
  total,
  pageSize,
  onPageChange,
  isLoading = false,
  isError = false,
  emptyMessage,
  emptyDescription,
  hiddenColumns = [],
}: TransactionsTableProps) {
  const allColumns: PanelDataTableColumn<TransactionItem>[] = [
    {
      key: 'date',
      header: 'Data',
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col whitespace-nowrap">
          <Text size="sm" className="tabular-nums">
            {formatIsoDate(item.date)}
          </Text>
          {item.occurredTime && (
            <Text size="xs" color="secondary" className="tabular-nums">
              {item.occurredTime.slice(0, 5)}
            </Text>
          )}
        </div>
      ),
    },
    {
      key: 'situation',
      header: 'Situação',
      cell: (item) => <TransactionStatusBadge kind={item.kind} status={item.status} date={item.date} today={today} />,
    },
    {
      key: 'amount',
      header: 'Valor',
      sortable: true,
      cellClassName: 'whitespace-nowrap',
      cell: (item) => (
        <MoneyValue
          cents={item.amountCents}
          kind={item.kind === 'transfer' ? 'transfer' : item.kind}
          showPlusSign={item.kind === 'income'}
          size="sm"
          weight="medium"
          className="tabular-nums"
        />
      ),
    },
    {
      key: 'description',
      header: 'Descrição',
      sortable: true,
      minWidth: 220,
      cell: (item) => (
        <div className="flex max-w-80 min-w-0 flex-col">
          <Text size="sm" className="truncate" title={item.description}>
            {item.description}
          </Text>
          {item.notes && (
            <Text size="xs" color="secondary" className="truncate" title={item.notes}>
              {item.notes}
            </Text>
          )}
        </div>
      ),
    },
    {
      key: 'account',
      header: 'Conta',
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <AccountAvatar type={item.account.type} institution={item.account.institution} size="sm" />
          <Text size="sm">
            {item.kind === 'transfer' && item.transfer
              ? item.amountCents < 0
                ? `${item.account.name} → ${item.transfer.counterpartAccountName}`
                : `${item.transfer.counterpartAccountName} → ${item.account.name}`
              : item.account.name}
          </Text>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoria',
      sortable: true,
      cell: (item) =>
        item.category ? (
          <div
            className="flex items-center gap-2 whitespace-nowrap"
            title={item.category.parentName ? `${item.category.parentName} › ${item.category.name}` : undefined}
          >
            <CategoryIcon icon={item.category.icon} color={item.category.color} size="sm" />
            <Text size="sm">{item.category.name}</Text>
          </div>
        ) : item.kind === 'transfer' ? (
          <Muted />
        ) : (
          <Text size="sm" color="secondary" className="whitespace-nowrap">
            Sem categoria
          </Text>
        ),
    },
    {
      key: 'paymentMethod',
      header: 'Forma de pagamento',
      cell: (item) =>
        item.paymentMethod ? (
          <Text size="sm" className="whitespace-nowrap">
            {PAYMENT_METHOD_LABELS[item.paymentMethod]}
          </Text>
        ) : (
          <Muted />
        ),
    },
    {
      key: 'type',
      header: 'Tipo',
      cell: (item) =>
        item.recurring ? (
          <Panel.RowBadge color="blue" className="gap-1 whitespace-nowrap">
            <Icon icon="recurring" className="size-3" />
            Recorrente
          </Panel.RowBadge>
        ) : item.installment ? (
          <Panel.RowBadge color="gray" className="whitespace-nowrap">
            Parcela {item.installment.number}/{item.installment.total}
          </Panel.RowBadge>
        ) : (
          <Text size="sm" color="secondary">
            Única
          </Text>
        ),
    },
    {
      key: 'paidAt',
      header: 'Pago em',
      sortable: true,
      cell: (item) =>
        item.paidAt ? (
          <Text size="sm" className="whitespace-nowrap tabular-nums">
            {formatIsoDate(item.paidAt)}
          </Text>
        ) : (
          <Muted />
        ),
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: <span className="sr-only">Ações</span>,
            cellClassName: 'w-12 py-0',
            cell: (item: TransactionItem) => (
              <RowActions item={item} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
            ),
          },
        ]
      : []),
  ];

  const columns = allColumns.filter((column) => !(hiddenColumns as string[]).includes(column.key));
  const tableSort: PanelDataTableSort = sort ?? { key: 'date', dir: 'desc' };

  return (
    // DataTable direto no Root, como no design system (a tabela já desenha o próprio corpo).
    <Panel.Root>
      <Panel.DataTable
        data={items}
        columns={columns}
        getRowKey={(item) => item.id}
        manual
        stretch
        size="sm"
        isLoading={isLoading}
        isError={isError}
        errorMessage="Não foi possível carregar os lançamentos"
        emptyIcon="transactions"
        emptyMessage={emptyMessage}
        emptyDescription={emptyDescription}
        sort={tableSort}
        onSortChange={(next) => {
          // Voltar ao padrão (sem ordem) é o mesmo que data decrescente.
          if (!next || (next.key === 'date' && next.dir === 'desc')) {
            onSortChange(null);
          } else if (isSortKey(next.key)) {
            onSortChange({ key: next.key, dir: next.dir });
          }
        }}
        rowClassName={(item) =>
          transactionSituation(item.status, item.date, today) === 'overdue'
            ? '[&>td:first-child]:shadow-[inset_3px_0_0_var(--color-icon-status-critical-rest)]'
            : undefined
        }
        {...(total > pageSize
          ? {
              pageSize,
              totalCount: total,
              page: page - 1,
              onPageChange: (next: number) => onPageChange(next + 1),
              paginationLabel: ({ from, to, total: count }: { from: number; to: number; total: number }) =>
                `${from}–${to} de ${count}`,
            }
          : {})}
      />
    </Panel.Root>
  );
}
