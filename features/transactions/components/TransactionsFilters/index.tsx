'use client';

import { AccountSelect, type AccountOption } from '@/components/finance/AccountSelect';
import { CategorySelect, type CategoryOption } from '@/components/finance/CategorySelect';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import type { TransactionFilters } from '@/features/transactions/filters';
import type { CategoryKind } from '@/lib/categories';
import type { TransactionKind, TransactionSituation } from '@/lib/transactions';
import * as React from 'react';

export type TransactionsFiltersProps = {
  filters: TransactionFilters;
  onChange: (changes: Partial<TransactionFilters>) => void;
  accounts: AccountOption[];
  categories: CategoryOption[];
  /** Atrasadas em qualquer período, para o contador do filtro rápido. */
  overdueCount?: number;
};

/** Valor da aba "Todas" (o Radix não aceita valor vazio). */
const ALL = 'todas';

const SITUATION_CHIPS: Record<TransactionKind | 'all', [pending: string, paid: string]> = {
  expense: ['A pagar', 'Pagas'],
  income: ['A receber', 'Recebidas'],
  transfer: ['Previstas', 'Efetivadas'],
  all: ['Pendentes', 'Efetivadas'],
};

/** Situação, conta, categoria e busca (o período fica no header). Mudar um filtro volta para a página 1. */
export function TransactionsFilters({
  filters,
  onChange,
  accounts,
  categories,
  overdueCount = 0,
}: TransactionsFiltersProps) {
  const [search, setSearch] = React.useState(filters.search);
  const [syncedSearch, setSyncedSearch] = React.useState(filters.search);
  if (filters.search !== syncedSearch) {
    setSyncedSearch(filters.search);
    setSearch(filters.search);
  }
  const categoryKind: CategoryKind | null =
    filters.kind === 'income' || filters.kind === 'expense' ? filters.kind : null;
  const hasExtraFilters = Boolean(filters.accountId || filters.categoryId || filters.search || filters.situation);
  const [pendingLabel, paidLabel] = SITUATION_CHIPS[filters.kind ?? 'all'];
  const situations: { value: TransactionSituation | null; label: string }[] = [
    { value: null, label: 'Todas' },
    { value: 'overdue', label: 'Atrasadas' },
    { value: 'pending', label: pendingLabel },
    { value: 'paid', label: paidLabel },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Tabs.Root
          value={filters.situation ?? ALL}
          onValueChange={(next) =>
            onChange({
              situation: next === ALL ? null : (next as TransactionSituation),
            })
          }
        >
          <Tabs.List aria-label="Situação">
            {situations.map((option) => (
              <Tabs.Tab
                key={option.label}
                value={option.value ?? ALL}
                // As abas filtram a tabela abaixo; não há painel para referenciar.
                aria-controls={undefined}
              >
                {option.label}
                {option.value === 'overdue' && overdueCount > 0 && (
                  <span className="rounded-full border border-current px-1.5 text-[11px] leading-4 font-medium text-typography-status-critical-rest tabular-nums">
                    {overdueCount}
                  </span>
                )}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>
        {filters.situation === 'overdue' && (
          <span className="text-xs text-typography-neutral-secondary">Vencidas e não pagas, de qualquer mês</span>
        )}
      </div>
      <div className="grid flex-1 gap-2 sm:grid-cols-3">
        <AccountSelect
          aria-label="Filtrar por conta"
          accounts={accounts}
          allLabel="Todas as contas"
          value={filters.accountId}
          onValueChange={(accountId) => onChange({ accountId })}
        />
        {filters.kind !== 'transfer' && (
          <CategorySelect
            key={categoryKind ?? 'todas'}
            aria-label="Filtrar por categoria"
            categories={categories}
            kind={categoryKind}
            noneLabel="Todas as categorias"
            value={filters.categoryId}
            onValueChange={(categoryId) => onChange({ categoryId })}
          />
        )}
        <form
          role="search"
          className="relative"
          onSubmit={(event) => {
            event.preventDefault();
            onChange({ search: search.trim() });
          }}
        >
          <Icon
            icon="search"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-icon-neutral-rest"
          />
          <Input
            type="search"
            aria-label="Buscar na descrição"
            placeholder="Buscar"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onBlur={() => search.trim() !== filters.search && onChange({ search: search.trim() })}
            className="pl-9"
            maxLength={80}
          />
        </form>
      </div>
      {hasExtraFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({
              accountId: null,
              categoryId: null,
              search: '',
              situation: null,
            })
          }
        >
          <Icon icon="close" data-icon="inline-start" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
