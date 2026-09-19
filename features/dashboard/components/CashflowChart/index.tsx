'use client';

import { EvilAreaChart } from '@/components/evilcharts/charts/recharts-area-chart';
import type { CashflowPoint } from '@/features/dashboard/types';
import { formatMoney, formatMoneyCompact } from '@/lib/money';
import { classMerge } from '@/lib/utils';

const formatValue = (cents: number) => formatMoney(cents);

/** Dentro de um mês só o dia basta; em período maior, o dia precisa do mês. */
export function dayLabel(date: string, withMonth: boolean) {
  return withMonth ? `${date.slice(8)}/${date.slice(5, 7)}` : date.slice(8);
}

export function spansMoreThanOneMonth(points: CashflowPoint[]) {
  return points.length > 0 && points.some((point) => point.date.slice(0, 7) !== points[0]?.date.slice(0, 7));
}

export type CashflowChartProps = {
  points: CashflowPoint[];
  className?: string;
};

/**
 * A curva do que sobrou desde o primeiro dia do período (EvilCharts sobre
 * Recharts). Sobe quando entra mais do que sai; cruzar o zero é o sinal de que
 * o período está no vermelho — por isso a cor acompanha o fim da linha.
 *
 * Decorativo para leitores de tela: o bloco entrega os mesmos números em texto.
 */
export function CashflowChart({ points, className }: CashflowChartProps) {
  const withMonth = spansMoreThanOneMonth(points);
  const isNegative = (points.at(-1)?.cumulativeCents ?? 0) < 0;
  const data = points.map((point) => ({ day: dayLabel(point.date, withMonth), balance: point.cumulativeCents }));
  const config = {
    balance: {
      label: 'Sobrou até aqui',
      colors: {
        light: [isNegative ? 'var(--color-icon-finance-expense)' : 'var(--color-icon-finance-income)'],
      },
      formatValue,
    },
  };

  return (
    <div aria-hidden data-testid="cashflow-chart" className={classMerge('h-56', className)}>
      <EvilAreaChart
        data={data}
        config={config}
        className="aspect-auto h-full"
        curveType="monotone"
        chartProps={{ accessibilityLayer: false, margin: { top: 8, right: 8, bottom: 0, left: 8 } }}
      >
        <EvilAreaChart.Grid />
        <EvilAreaChart.XAxis dataKey="day" />
        <EvilAreaChart.YAxis
          width={64}
          // Milhares bastam no eixo: o valor exato sai no tooltip.
          tickFormatter={(value: number) => formatMoneyCompact(value)}
        />
        <EvilAreaChart.Tooltip />
        <EvilAreaChart.Area dataKey="balance" variant="gradient" strokeVariant="solid" strokeWidth={2} />
      </EvilAreaChart>
    </div>
  );
}
