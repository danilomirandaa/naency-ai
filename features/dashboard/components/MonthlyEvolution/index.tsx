import { MoneyValue } from '@/components/finance/MoneyValue';
import { Text } from '@/components/ui/Text';
import { DashboardCard } from '@/features/dashboard/components/DashboardCard';
import type { EvolutionPoint } from '@/features/dashboard/types';
import { formatMonth } from '@/lib/dates';

const shortMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });

function monthLabel(month: string) {
  return shortMonth.format(new Date(`${month}-01T00:00:00Z`)).replace('.', '');
}

export type MonthlyEvolutionProps = {
  data: EvolutionPoint[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
};

/** "Estamos melhorando?": receitas e despesas dos últimos meses em colunas, com tabela para leitores de tela. */
export function MonthlyEvolution({ data, isLoading, isError }: MonthlyEvolutionProps) {
  const points = data ?? [];
  const max = Math.max(1, ...points.flatMap((point) => [point.incomeCents, Math.abs(point.expenseCents)]));
  const empty = points.every((point) => point.incomeCents === 0 && point.expenseCents === 0);

  return (
    <DashboardCard
      title="Evolução"
      description="Receitas e despesas dos últimos 6 meses"
      isLoading={isLoading}
      isError={isError}
      isEmpty={empty}
      emptyIcon="reports"
      emptyMessage="Sem lançamentos nos últimos meses"
    >
      <div className="flex flex-col gap-3 px-4 py-3">
        <div aria-hidden className="flex h-40 items-end gap-3">
          {points.map((point) => (
            <div key={point.month} className="flex h-full flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end justify-center gap-1">
                <div
                  className="w-1/3 max-w-4 rounded-t-[3px] bg-icon-finance-income"
                  style={{ height: `${(point.incomeCents / max) * 100}%` }}
                />
                <div
                  className="w-1/3 max-w-4 rounded-t-[3px] bg-icon-finance-expense"
                  style={{ height: `${(Math.abs(point.expenseCents) / max) * 100}%` }}
                />
              </div>
              <Text size="xs" color="secondary">
                {monthLabel(point.month)}
              </Text>
            </div>
          ))}
        </div>
        <div aria-hidden className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-icon-finance-income" />
            <Text size="xs" color="secondary">
              Receitas
            </Text>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-icon-finance-expense" />
            <Text size="xs" color="secondary">
              Despesas
            </Text>
          </span>
        </div>
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
