'use client';

import { EvilBarChart } from '@/components/evilcharts/charts/recharts-bar-chart';
import type { EvolutionPoint } from '@/features/dashboard/types';
import { formatMoney } from '@/lib/money';
import { classMerge } from '@/lib/utils';

const shortMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });

/** "2026-09" → "set". */
export function monthLabel(month: string) {
  return shortMonth.format(new Date(`${month}-01T00:00:00Z`)).replace('.', '');
}

const formatValue = (cents: number) => formatMoney(cents);

// As cores apontam para os tokens de finanças, que já mudam no tema escuro.
const config = {
  income: { label: 'Receitas', colors: { light: ['var(--color-icon-finance-income)'] }, formatValue },
  expense: { label: 'Despesas', colors: { light: ['var(--color-icon-finance-expense)'] }, formatValue },
};

export type EvolutionChartProps = {
  points: EvolutionPoint[];
  className?: string;
};

/**
 * Colunas de receitas × despesas por mês (EvilCharts sobre Recharts). É decorativo
 * para leitores de tela: quem usa o gráfico entrega a mesma informação em tabela.
 */
export function EvolutionChart({ points, className }: EvolutionChartProps) {
  const data = points.map((point) => ({
    month: monthLabel(point.month),
    income: point.incomeCents,
    expense: Math.abs(point.expenseCents),
  }));

  return (
    <div aria-hidden data-testid="evolution-chart" className={classMerge('h-48', className)}>
      <EvilBarChart
        data={data}
        config={config}
        className="aspect-auto h-full"
        barRadius={4}
        barGap={3}
        chartProps={{ accessibilityLayer: false, margin: { top: 4, right: 4, bottom: 0, left: 4 } }}
      >
        <EvilBarChart.Grid />
        <EvilBarChart.XAxis dataKey="month" />
        <EvilBarChart.Tooltip />
        <EvilBarChart.Legend align="left" verticalAlign="bottom" variant="circle" />
        <EvilBarChart.Bar dataKey="income" />
        <EvilBarChart.Bar dataKey="expense" />
      </EvilBarChart>
    </div>
  );
}
