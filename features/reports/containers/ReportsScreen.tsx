'use client';

import { PeriodPicker } from '@/components/finance/PeriodPicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { dashboardQuery } from '@/features/dashboard/api/dashboard.queries';
import { CategoryBreakdown } from '@/features/dashboard/components/CategoryBreakdown';
import { MonthResult } from '@/features/dashboard/components/MonthResult';
import { MonthlyEvolution } from '@/features/dashboard/components/MonthlyEvolution';
import { currentMonth, isMonth, monthRange } from '@/lib/dates';
import { type DateRange, isValidRange, wholeMonthOf } from '@/lib/periods';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type ParamsLike = { get(name: string): string | null };

/** Período da URL: ?de=&ate= ou ?mes=; padrão, o mês atual. */
export function rangeFromParams(params: ParamsLike): DateRange {
  const custom = { from: params.get('de'), to: params.get('ate') };
  if (isValidRange(custom)) {
    return custom;
  }
  const month = params.get('mes');
  return monthRange(isMonth(month) ? month : currentMonth());
}

/** Parâmetros curtos: nada no mês atual, ?mes= em mês inteiro, ?de=&ate= no resto. */
export function rangeQuery(range: DateRange) {
  const month = wholeMonthOf(range);
  if (month) {
    return month === currentMonth() ? '' : `mes=${month}`;
  }
  return `de=${range.from}&ate=${range.to}`;
}

/** Container: relatórios do mês e evolução de 12 meses, reaproveitando os blocos do dashboard. */
export function ReportsScreen({ workspaceId, today }: { workspaceId: string; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = rangeFromParams(searchParams);
  const result = useQuery(dashboardQuery.block(workspaceId, 'resultado', range));
  const categories = useQuery(dashboardQuery.block(workspaceId, 'categorias', range));
  const evolution = useQuery(dashboardQuery.block(workspaceId, 'evolucao-anual', range));
  const query = rangeQuery(range);

  const changeRange = (next: DateRange) => {
    const nextQuery = rangeQuery(next);
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader
        title="Relatórios"
        description="Para onde foi o dinheiro no período e como os meses se comparam."
        actions={
          <PeriodPicker value={range} today={today} onValueChange={changeRange} />
        }
      />
      <MonthResult data={result.data} isLoading={result.isPending} isError={result.isError} />
      <MonthlyEvolution data={evolution.data} isLoading={evolution.isPending} isError={evolution.isError} months={12} />
      <CategoryBreakdown
        data={categories.data}
        isLoading={categories.isPending}
        isError={categories.isError}
        transactionsHref={(categoryId) =>
          `/transacoes/despesas?${[query, categoryId ? `categoria=${categoryId}` : ''].filter(Boolean).join('&')}`
        }
      />
    </div>
  );
}
