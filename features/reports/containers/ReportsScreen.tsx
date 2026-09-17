'use client';

import { MonthPicker } from '@/components/finance/MonthPicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { dashboardQuery } from '@/features/dashboard/api/dashboard.queries';
import { CategoryBreakdown } from '@/features/dashboard/components/CategoryBreakdown';
import { MonthResult } from '@/features/dashboard/components/MonthResult';
import { MonthlyEvolution } from '@/features/dashboard/components/MonthlyEvolution';
import { currentMonth, isMonth } from '@/lib/dates';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/** Container: relatórios do mês e evolução de 12 meses, reaproveitando os blocos do dashboard. */
export function ReportsScreen({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get('mes');
  const month = isMonth(requested) ? requested : currentMonth();
  const result = useQuery(dashboardQuery.block(workspaceId, 'resultado', month));
  const categories = useQuery(dashboardQuery.block(workspaceId, 'categorias', month));
  const evolution = useQuery(dashboardQuery.block(workspaceId, 'evolucao-anual', month));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader
        title="Relatórios"
        description="Para onde foi o dinheiro e como os meses se comparam."
        actions={
          <MonthPicker
            value={month}
            onValueChange={(next) => router.replace(next === currentMonth() ? pathname : `${pathname}?mes=${next}`, { scroll: false })}
          />
        }
      />
      <MonthResult data={result.data} isLoading={result.isPending} isError={result.isError} />
      <MonthlyEvolution data={evolution.data} isLoading={evolution.isPending} isError={evolution.isError} months={12} />
      <CategoryBreakdown
        data={categories.data}
        isLoading={categories.isPending}
        isError={categories.isError}
        transactionsHref={(categoryId) =>
          categoryId ? `/transacoes/despesas?mes=${month}&categoria=${categoryId}` : `/transacoes/despesas?mes=${month}`
        }
      />
    </div>
  );
}
