'use client';

import { CategoryIcon } from '@/components/finance/CategoryIcon';
import { MoneyValue } from '@/components/finance/MoneyValue';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { DashboardCard } from '@/features/dashboard/components/DashboardCard';
import type { CategorySlice } from '@/features/dashboard/types';
import Link from 'next/link';
import * as React from 'react';

export type CategoryBreakdownProps = {
  data: CategorySlice[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  /** Link para ver os lançamentos da categoria no mês. */
  transactionsHref: (categoryId: string | null) => string;
};

const VISIBLE = 6;

/** "Para onde foi o dinheiro?": despesas por categoria em barras, com subcategorias ao abrir. */
export function CategoryBreakdown({ data, isLoading, isError, transactionsHref }: CategoryBreakdownProps) {
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const slices = data ?? [];
  const total = slices.reduce((sum, slice) => sum + slice.totalCents, 0);
  const visible = slices.slice(0, VISIBLE);
  const rest = slices.slice(VISIBLE);
  const restTotal = rest.reduce((sum, slice) => sum + slice.totalCents, 0);

  return (
    <DashboardCard
      title="Para onde foi o dinheiro"
      description={total > 0 ? <>Despesas do mês: <MoneyValue cents={total} kind="neutral" size="xs" /></> : undefined}
      isLoading={isLoading}
      isError={isError}
      isEmpty={slices.length === 0}
      emptyIcon="reports"
      emptyMessage="Nenhuma despesa neste mês"
    >
      <ul aria-label="Despesas por categoria" className="flex flex-col gap-3 px-4 py-3">
        {visible.map((slice) => {
          const percent = total > 0 ? Math.round((slice.totalCents / total) * 100) : 0;
          const key = slice.categoryId ?? 'sem-categoria';
          const open = expanded === key;
          return (
            <li key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                {slice.icon && slice.color ? (
                  <CategoryIcon icon={slice.icon} color={slice.color} size="sm" />
                ) : (
                  <span aria-hidden className="size-5 rounded-[5px] bg-background-neutral-200" />
                )}
                {slice.children.length > 0 ? (
                  <Button
                    variant="link"
                    size="xs"
                    className="h-auto px-0 text-sm font-normal"
                    aria-expanded={open}
                    onClick={() => setExpanded(open ? null : key)}
                  >
                    {slice.name}
                    <Icon icon={open ? 'chevron-up' : 'chevron-down'} data-icon="inline-end" />
                  </Button>
                ) : (
                  <Text size="sm">{slice.name}</Text>
                )}
                <span className="flex-1" />
                <Link href={transactionsHref(slice.categoryId)} className="rounded-control-sm outline-hidden hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                  <MoneyValue cents={slice.totalCents} kind="neutral" size="sm" className="tabular-nums" />
                </Link>
                <Text size="xs" color="secondary" className="w-9 text-right tabular-nums">
                  {percent}%
                </Text>
              </div>
              <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-background-neutral-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(percent, 1)}%`, backgroundColor: slice.color ?? 'var(--color-icon-neutral-rest)' }}
                />
              </div>
              {open && (
                <ul aria-label={`Subcategorias de ${slice.name}`} className="flex flex-col gap-1 pl-7">
                  {slice.children.map((child) => (
                    <li key={child.categoryId} className="flex items-center justify-between gap-2">
                      <Text size="xs" color="secondary">
                        {child.name}
                      </Text>
                      <MoneyValue cents={child.totalCents} kind="neutral" size="xs" className="tabular-nums" />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
        {rest.length > 0 && (
          <li className="flex items-center justify-between gap-2">
            <Text size="sm" color="secondary">
              Outras {rest.length} categorias
            </Text>
            <MoneyValue cents={restTotal} kind="neutral" size="sm" className="tabular-nums" />
          </li>
        )}
      </ul>
    </DashboardCard>
  );
}
