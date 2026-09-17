'use client';

import { CategoryIcon } from '@/components/finance/CategoryIcon';
import { MoneyValue } from '@/components/finance/MoneyValue';
import { Button } from '@/components/ui/Button';
import { Icon, type Icons } from '@/components/ui/Icon';
import { List } from '@/components/ui/List';
import { Panel } from '@/components/ui/Panel';
import { Spinner } from '@/components/ui/Spinner';
import { Text } from '@/components/ui/Text';
import type { TransactionItem } from '@/features/transactions/types';
import { formatDayHeading } from '@/lib/dates';
import { useTransition } from 'react';

export type TransactionsListProps = {
  items: TransactionItem[];
  canEdit: boolean;
  onEdit: (transaction: TransactionItem) => void;
  onDelete: (transaction: TransactionItem) => void;
  onStatusChange: (transaction: TransactionItem, status: 'cleared' | 'planned') => Promise<void>;
  onCreate?: () => void;
  /** Paginação: página atual, total de itens e tamanho da página. */
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** Filtros ativos mudam o texto do estado vazio. */
  isFiltered?: boolean;
};

const KIND_ICONS: Record<TransactionItem['kind'], Icons> = {
  income: 'income',
  expense: 'expense',
  transfer: 'transfer',
};

function subtitle(item: TransactionItem) {
  if (item.kind === 'transfer' && item.transfer) {
    return item.amountCents < 0
      ? `${item.account.name} → ${item.transfer.counterpartAccountName}`
      : `${item.transfer.counterpartAccountName} → ${item.account.name}`;
  }
  const category = item.category
    ? item.category.parentName
      ? `${item.category.parentName} › ${item.category.name}`
      : item.category.name
    : 'Sem categoria';
  return `${category} · ${item.account.name}`;
}

function groupByDate(items: TransactionItem[]) {
  const groups: { date: string; items: TransactionItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last?.date === item.date) {
      last.items.push(item);
    } else {
      groups.push({ date: item.date, items: [item] });
    }
  }
  return groups;
}

function ConfirmButton({
  item,
  onStatusChange,
}: Pick<TransactionsListProps, 'onStatusChange'> & { item: TransactionItem }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      aria-label={`Marcar ${item.description} como efetivado`}
      onClick={() => startTransition(() => onStatusChange(item, 'cleared'))}
    >
      {isPending ? <Spinner label={null} data-icon="inline-start" /> : <Icon icon="check" data-icon="inline-start" />}
      Efetivar
    </Button>
  );
}

/** Lançamentos agrupados por dia, com valor colorido por tipo e ações de quem edita. */
export function TransactionsList({
  items,
  canEdit,
  onEdit,
  onDelete,
  onStatusChange,
  onCreate,
  page,
  total,
  pageSize,
  onPageChange,
  isLoading = false,
  isError = false,
  onRetry,
  isFiltered = false,
}: TransactionsListProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <Panel.Root>
      <Panel.Body>
        <Panel.QueryState
          isLoading={isLoading}
          isError={isError}
          isEmpty={items.length === 0}
          skeleton={
            <div className="flex w-full flex-col">
              <Panel.RowSkeleton />
              <Panel.RowSkeleton />
              <Panel.RowSkeleton />
            </div>
          }
          errorMessage="Não foi possível carregar os lançamentos"
          errorAction={
            onRetry && (
              <Button variant="outline" onClick={onRetry}>
                Tentar de novo
              </Button>
            )
          }
          emptyIcon="transactions"
          emptyMessage={isFiltered ? 'Nada encontrado com esses filtros' : 'Nenhum lançamento neste mês'}
          emptyDescription={
            canEdit && !isFiltered ? 'Lance receitas, despesas e transferências para acompanhar os saldos.' : undefined
          }
          emptyAction={
            canEdit &&
            !isFiltered &&
            onCreate && (
              <Button onClick={onCreate}>
                <Icon icon="add" data-icon="inline-start" />
                Novo lançamento
              </Button>
            )
          }
        >
          <div className="flex flex-col">
            {groupByDate(items).map((group) => (
              <section key={group.date} aria-labelledby={`dia-${group.date}`}>
                <h3
                  id={`dia-${group.date}`}
                  className="border-border-neutral-subtle border-b bg-background-neutral-100 px-4 py-1.5 text-xs font-medium text-typography-neutral-secondary"
                >
                  {formatDayHeading(group.date)}
                </h3>
                <List.Root aria-label={`Lançamentos de ${formatDayHeading(group.date)}`}>
                  {group.items.map((item) => (
                    <List.Item key={item.id}>
                      {item.category ? (
                        <CategoryIcon icon={item.category.icon} color={item.category.color} />
                      ) : (
                        <span
                          aria-hidden
                          className="flex size-8 shrink-0 items-center justify-center rounded-control-sm bg-background-neutral-100 text-icon-neutral-rest [&_svg]:size-4"
                        >
                          <Icon icon={KIND_ICONS[item.kind]} />
                        </span>
                      )}
                      <List.ItemText>
                        <Text size="sm" weight="medium" className="truncate">
                          {item.description}
                          {item.status === 'planned' && (
                            <Panel.RowBadge color="gray" className="ml-2 align-middle">
                              Previsto
                            </Panel.RowBadge>
                          )}
                        </Text>
                        <Text size="xs" color="secondary" className="truncate">
                          {subtitle(item)}
                        </Text>
                      </List.ItemText>
                      <MoneyValue
                        cents={item.amountCents}
                        kind={item.kind === 'transfer' ? 'transfer' : item.kind}
                        showPlusSign={item.kind === 'income'}
                        size="sm"
                        className="tabular-nums"
                      />
                      {canEdit && (
                        <div className="flex items-center gap-1">
                          {item.status === 'planned' && <ConfirmButton item={item} onStatusChange={onStatusChange} />}
                          <Button variant="ghost" size="icon-sm" aria-label={`Editar ${item.description}`} onClick={() => onEdit(item)}>
                            <Icon icon="edit" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${item.description}`} onClick={() => onDelete(item)}>
                            <Icon icon="delete" />
                          </Button>
                        </div>
                      )}
                    </List.Item>
                  ))}
                </List.Root>
              </section>
            ))}
          </div>
        </Panel.QueryState>
      </Panel.Body>
      {!isLoading && !isError && total > pageSize && (
        <Panel.Footer>
          <nav aria-label="Paginação" className="flex w-full items-center justify-between gap-3">
            <Text size="xs" color="secondary">
              {first}–{last} de {total}
            </Text>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                <Icon icon="chevron-left" data-icon="inline-start" />
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
                Próxima
                <Icon icon="chevron-right" data-icon="inline-end" />
              </Button>
            </div>
          </nav>
        </Panel.Footer>
      )}
    </Panel.Root>
  );
}
