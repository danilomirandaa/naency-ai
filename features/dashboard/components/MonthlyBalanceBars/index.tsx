import { MoneyValue } from '@/components/finance/MoneyValue';
import { Text } from '@/components/ui/Text';
import { monthLabel } from '@/features/dashboard/components/EvolutionChart';
import { classMerge } from '@/lib/utils';

export type MonthlyBalanceBarsProps = {
  balances: { month: string; netCents: number }[];
  className?: string;
};

/**
 * Largura da barra em % do trilho inteiro. O maior mês (em módulo) ocupa o
 * espaço todo do seu lado, então a comparação entre meses é direta.
 */
export function barWidth(netCents: number, maxAbsCents: number) {
  if (maxAbsCents === 0) {
    return 0;
  }
  return Math.round((Math.abs(netCents) / maxAbsCents) * 50 * 10) / 10;
}

/**
 * Barras divergentes de um eixo central: o que sobrou vai para a direita, o que
 * faltou para a esquerda. Em CSS, e não em gráfico — com seis meses a leitura é
 * melhor assim, e cada valor fica escrito ao lado, sem depender de tooltip.
 */
export function MonthlyBalanceBars({ balances, className }: MonthlyBalanceBarsProps) {
  const maxAbs = Math.max(...balances.map((item) => Math.abs(item.netCents)), 0);

  return (
    <ul aria-label="Resultado por mês" className={classMerge('flex flex-col gap-2', className)}>
      {balances.map((item) => {
        const width = barWidth(item.netCents, maxAbs);
        const negative = item.netCents < 0;
        return (
          <li key={item.month} className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3">
            <Text size="xs" color="secondary" className="capitalize">
              {monthLabel(item.month)}
            </Text>
            {/* O trilho tem o zero no meio: a barra cresce dali para um dos lados. */}
            <div aria-hidden className="relative h-5">
              <div className="-translate-x-1/2 absolute inset-y-0 left-1/2 w-px bg-border-neutral-subtle" />
              {width > 0 && (
                <div
                  className={classMerge(
                    'absolute inset-y-0.5 rounded-sm',
                    negative ? 'bg-icon-finance-expense' : 'bg-icon-finance-income',
                  )}
                  style={negative ? { right: '50%', width: `${width}%` } : { left: '50%', width: `${width}%` }}
                />
              )}
            </div>
            <MoneyValue
              cents={item.netCents}
              kind={negative ? 'expense' : 'income'}
              showPlusSign={item.netCents > 0}
              size="xs"
              weight="medium"
              className="w-24 text-right tabular-nums"
            />
          </li>
        );
      })}
    </ul>
  );
}
