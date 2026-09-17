'use client';

import { AccountSelect, type AccountOption } from '@/components/finance/AccountSelect';
import { CategorySelect, type CategoryOption } from '@/components/finance/CategorySelect';
import { MonthPicker } from '@/components/finance/MonthPicker';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import type { TransactionFilters } from '@/features/transactions/filters';
import type { CategoryKind } from '@/lib/categories';
import * as React from 'react';

export type TransactionsFiltersProps = {
  filters: TransactionFilters;
  onChange: (changes: Partial<TransactionFilters>) => void;
  accounts: AccountOption[];
  categories: CategoryOption[];
};

/** Período, conta, categoria e busca. Mudar qualquer filtro volta para a página 1. */
export function TransactionsFilters({ filters, onChange, accounts, categories }: TransactionsFiltersProps) {
  const [search, setSearch] = React.useState(filters.search);
  const [syncedSearch, setSyncedSearch] = React.useState(filters.search);
  if (filters.search !== syncedSearch) {
    setSyncedSearch(filters.search);
    setSearch(filters.search);
  }
  const categoryKind: CategoryKind | null =
    filters.kind === 'income' || filters.kind === 'expense' ? filters.kind : null;
  const hasExtraFilters = Boolean(filters.accountId || filters.categoryId || filters.search);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
      <MonthPicker value={filters.month} onValueChange={(month) => onChange({ month })} />
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
        <Button variant="ghost" size="sm" onClick={() => onChange({ accountId: null, categoryId: null, search: '' })}>
          <Icon icon="close" data-icon="inline-start" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
