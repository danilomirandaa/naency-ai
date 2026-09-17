import { MoneyValue } from '@/components/finance/MoneyValue';
import { Text } from '@/components/ui/Text';
import { DashboardCard } from '@/features/dashboard/components/DashboardCard';
import type { MonthResultData } from '@/features/dashboard/types';
import { formatMonth, shiftMonth } from '@/lib/dates';

export type MonthResultProps = {
  data: MonthResultData | undefined;
  isLoading?: boolean;
  isError?: boolean;
};

/** "Ganhamos mais do que gastamos?" com a variação das despesas sobre o mês anterior. */
export function expenseTrend(current: number, previous: number) {
  const now = Math.abs(current);
  const before = Math.abs(previous);
  if (before === 0) {
    return null;
  }
  const change = Math.round(((now - before) / before) * 100);
  if (change === 0) {
    return 'Despesas iguais às do mês anterior';
  }
  return change > 0 ? `Despesas ${change}% maiores que no mês anterior` : `Despesas ${-change}% menores que no mês anterior`;
}

export function MonthResult({ data, isLoading, isError }: MonthResultProps) {
  const income = data?.current.incomeCents ?? 0;
  const expense = data?.current.expenseCents ?? 0;
  const result = income + expense;
  const trend = data ? expenseTrend(expense, data.previous.expenseCents) : null;

  return (
    <DashboardCard
      title="Resultado do mês"
      description={data ? `${formatMonth(data.month)} · comparado a ${formatMonth(shiftMonth(data.month, -1)).toLowerCase()}` : undefined}
      isLoading={isLoading}
      isError={isError}
    >
      <div className="flex flex-col gap-3 px-4 py-3">
        <dl className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-0.5">
            <dt>
              <Text size="xs" color="secondary">
                Receitas
              </Text>
            </dt>
            <dd>
              <MoneyValue cents={income} kind="income" weight="semibold" className="tabular-nums" />
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt>
              <Text size="xs" color="secondary">
                Despesas
              </Text>
            </dt>
            <dd>
              <MoneyValue cents={expense} kind="expense" weight="semibold" className="tabular-nums" />
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt>
              <Text size="xs" color="secondary">
                Resultado
              </Text>
            </dt>
            <dd>
              <MoneyValue
                cents={result}
                kind={result < 0 ? 'expense' : 'neutral'}
                showPlusSign={result > 0}
                weight="semibold"
                className="tabular-nums"
              />
            </dd>
          </div>
        </dl>
        {trend && (
          <Text size="xs" color="secondary">
            {trend}
          </Text>
        )}
      </div>
    </DashboardCard>
  );
}
