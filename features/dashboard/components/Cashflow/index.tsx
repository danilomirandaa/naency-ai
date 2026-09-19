import { MoneyValue } from '@/components/finance/MoneyValue';
import { Text } from '@/components/ui/Text';
import { CashflowChart } from '@/features/dashboard/components/CashflowChart';
import { DashboardCard } from '@/features/dashboard/components/DashboardCard';
import type { CashflowPoint } from '@/features/dashboard/types';
import { formatIsoDate } from '@/lib/dates';

export type CashflowProps = {
  data: CashflowPoint[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
};

/** O melhor e o pior dia do período: o que explica os degraus da curva. */
export function extremes(points: CashflowPoint[]) {
  const withMovement = points.filter((point) => point.incomeCents !== 0 || point.expenseCents !== 0);
  if (withMovement.length === 0) {
    return null;
  }
  const byDay = withMovement.map((point) => ({ ...point, netCents: point.incomeCents + point.expenseCents }));
  const best = byDay.reduce((top, point) => (point.netCents > top.netCents ? point : top));
  const worst = byDay.reduce((low, point) => (point.netCents < low.netCents ? point : low));
  return { best, worst };
}

/**
 * "O período está no azul?": a curva do que sobrou dia a dia, com o total em
 * destaque. Responde diferente do saldo — aqui é só o que aconteceu no período.
 */
export function Cashflow({ data, isLoading, isError }: CashflowProps) {
  const points = data ?? [];
  const result = points.at(-1)?.cumulativeCents ?? 0;
  const days = extremes(points);

  return (
    <DashboardCard
      title="Como o período está indo"
      description="O que sobrou, dia a dia"
      isLoading={isLoading}
      isError={isError}
      isEmpty={days === null}
      emptyIcon="reports"
      emptyMessage="Sem lançamentos no período"
      emptyDescription="Importe um extrato ou lance algo para ver a curva"
    >
      <div className="flex flex-col gap-4 px-4 py-4">
        <div
          role="group"
          aria-label="Resumo do período"
          className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2"
        >
          <div className="flex flex-col gap-0.5">
            <Text size="xs" color="secondary">
              Sobrou no período
            </Text>
            <MoneyValue
              cents={result}
              kind={result < 0 ? 'expense' : 'income'}
              showPlusSign={result > 0}
              size="xl"
              weight="semibold"
              className="tabular-nums"
            />
          </div>
          {days && (
            <div className="flex gap-6">
              <div className="flex flex-col gap-0.5">
                <Text size="xs" color="secondary">
                  Melhor dia
                </Text>
                <div className="flex flex-col">
                  <MoneyValue cents={days.best.netCents} kind="income" showPlusSign size="sm" weight="medium" />
                  <Text size="xs" color="secondary">
                    {formatIsoDate(days.best.date)}
                  </Text>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <Text size="xs" color="secondary">
                  Dia mais caro
                </Text>
                <div className="flex flex-col">
                  <MoneyValue cents={days.worst.netCents} kind="expense" size="sm" weight="medium" />
                  <Text size="xs" color="secondary">
                    {formatIsoDate(days.worst.date)}
                  </Text>
                </div>
              </div>
            </div>
          )}
        </div>
        <CashflowChart points={points} />
        <table className="sr-only">
          <caption>O que sobrou a cada dia do período</caption>
          <thead>
            <tr>
              <th scope="col">Dia</th>
              <th scope="col">Entrou</th>
              <th scope="col">Saiu</th>
              <th scope="col">Sobrou até aqui</th>
            </tr>
          </thead>
          <tbody>
            {points
              .filter((point) => point.incomeCents !== 0 || point.expenseCents !== 0)
              .map((point) => (
                <tr key={point.date}>
                  <th scope="row">{formatIsoDate(point.date)}</th>
                  <td>
                    <MoneyValue cents={point.incomeCents} />
                  </td>
                  <td>
                    <MoneyValue cents={point.expenseCents} />
                  </td>
                  <td>
                    <MoneyValue cents={point.cumulativeCents} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
