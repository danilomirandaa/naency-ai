import { MoneyValue } from '@/components/finance/MoneyValue';
import { Text } from '@/components/ui/Text';
import { DashboardCard } from '@/features/dashboard/components/DashboardCard';
import { MonthlyBalanceBars } from '@/features/dashboard/components/MonthlyBalanceBars';
import type { EvolutionPoint } from '@/features/dashboard/types';
import { formatMonth } from '@/lib/dates';

export type MonthlyBalanceProps = {
  data: EvolutionPoint[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  /** Quantidade de meses mostrada (para o subtítulo). */
  months?: number;
};

export type MonthBalance = { month: string; netCents: number };

/** Resultado de cada mês: o que entrou menos o que saiu. */
export function monthlyBalances(points: EvolutionPoint[]): MonthBalance[] {
  return points.map((point) => ({ month: point.month, netCents: point.incomeCents + point.expenseCents }));
}

/**
 * Média por mês e em quantos deles sobrou dinheiro. A média usa todos os meses,
 * inclusive os zerados — é ela que diz o ritmo real, não a soma.
 */
export function balanceSummary(balances: MonthBalance[]) {
  if (balances.length === 0) {
    return null;
  }
  const total = balances.reduce((sum, item) => sum + item.netCents, 0);
  return {
    averageCents: Math.round(total / balances.length),
    positiveMonths: balances.filter((item) => item.netCents > 0).length,
    months: balances.length,
    best: balances.reduce((top, item) => (item.netCents > top.netCents ? item : top)),
  };
}

/**
 * "Em quantos meses eu fechei no azul?" — o resultado mês a mês, que a evolução
 * de receitas × despesas não responde sem fazer a conta de cabeça.
 */
export function MonthlyBalance({ data, isLoading, isError, months = 6 }: MonthlyBalanceProps) {
  const balances = monthlyBalances(data ?? []);
  const summary = balanceSummary(balances);
  const empty = balances.every((item) => item.netCents === 0);

  return (
    <DashboardCard
      title="Balanço mensal"
      description={`Quanto sobrou em cada um dos últimos ${months} meses`}
      isLoading={isLoading}
      isError={isError}
      isEmpty={empty}
      emptyIcon="reports"
      emptyMessage="Sem lançamentos nos últimos meses"
    >
      <div className="flex flex-col gap-4 px-4 py-4">
        {summary && (
          <div role="group" aria-label="Resumo dos meses" className="flex flex-wrap items-end gap-x-8 gap-y-2">
            <div className="flex flex-col gap-0.5">
              <Text size="xs" color="secondary">
                Média por mês
              </Text>
              <MoneyValue
                cents={summary.averageCents}
                kind={summary.averageCents < 0 ? 'expense' : 'income'}
                showPlusSign={summary.averageCents > 0}
                size="xl"
                weight="semibold"
                className="tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <Text size="xs" color="secondary">
                Fechou no azul
              </Text>
              <Text size="sm" weight="medium">
                {summary.positiveMonths} de {summary.months} meses
              </Text>
            </div>
            <div className="flex flex-col gap-0.5">
              <Text size="xs" color="secondary">
                Melhor mês
              </Text>
              <div className="flex flex-col">
                <MoneyValue
                  cents={summary.best.netCents}
                  kind={summary.best.netCents < 0 ? 'expense' : 'income'}
                  showPlusSign={summary.best.netCents > 0}
                  size="sm"
                  weight="medium"
                />
                <Text size="xs" color="secondary">
                  {formatMonth(summary.best.month)}
                </Text>
              </div>
            </div>
          </div>
        )}
        <MonthlyBalanceBars balances={balances} />
      </div>
    </DashboardCard>
  );
}
