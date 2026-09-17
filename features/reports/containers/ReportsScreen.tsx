'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { dashboardQuery } from '@/features/dashboard/api/dashboard.queries';
import { CategoryBreakdown } from '@/features/dashboard/components/CategoryBreakdown';
import { MonthResult } from '@/features/dashboard/components/MonthResult';
import { MonthlyEvolution } from '@/features/dashboard/components/MonthlyEvolution';
import { rangeParams, resolveRange } from '@/lib/periods';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

/** Container: relatórios do período do header e evolução de 12 meses, reaproveitando os blocos do dashboard. */
export function ReportsScreen({ workspaceId, periodCookie }: { workspaceId: string; periodCookie: string | null }) {
  const searchParams = useSearchParams();
  const range = resolveRange(searchParams, periodCookie);
  const result = useQuery(dashboardQuery.block(workspaceId, 'resultado', range));
  const categories = useQuery(dashboardQuery.block(workspaceId, 'categorias', range));
  const evolution = useQuery(dashboardQuery.block(workspaceId, 'evolucao-anual', range));
  const query = new URLSearchParams(rangeParams(range)).toString();


  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader
        title="Relatórios"
        description="Para onde foi o dinheiro no período e como os meses se comparam."
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
