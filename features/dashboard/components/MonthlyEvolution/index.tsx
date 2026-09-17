import { MoneyValue } from '@/components/finance/MoneyValue';
import { DashboardCard } from '@/features/dashboard/components/DashboardCard';
import { EvolutionChart } from '@/features/dashboard/components/EvolutionChart';
import type { EvolutionPoint } from '@/features/dashboard/types';
import { formatMonth } from '@/lib/dates';

export type MonthlyEvolutionProps = {
  data: EvolutionPoint[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  /** Quantidade de meses mostrada (para o subtítulo). */
  months?: number;
};

/** "Estamos melhorando?": receitas e despesas dos últimos meses em colunas, com tabela para leitores de tela. */
export function MonthlyEvolution({ data, isLoading, isError, months = 6 }: MonthlyEvolutionProps) {
  const points = data ?? [];
  const empty = points.every((point) => point.incomeCents === 0 && point.expenseCents === 0);

  return (
    <DashboardCard
      title="Evolução"
      description={`Receitas e despesas dos últimos ${months} meses`}
      isLoading={isLoading}
      isError={isError}
      isEmpty={empty}
      emptyIcon="reports"
      emptyMessage="Sem lançamentos nos últimos meses"
    >
      <div className="flex flex-col gap-3 px-4 py-3">
        <EvolutionChart points={points} />
        <table className="sr-only">
          <caption>Receitas e despesas por mês</caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              <th scope="col">Receitas</th>
              <th scope="col">Despesas</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.month}>
                <th scope="row">{formatMonth(point.month)}</th>
                <td>
                  <MoneyValue cents={point.incomeCents} />
                </td>
                <td>
                  <MoneyValue cents={point.expenseCents} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
