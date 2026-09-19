'use client';

import { type ChartConfig, EChartsAreaChart } from '@/components/evilcharts/charts/echarts-area-chart';
import type { CashflowPoint } from '@/features/dashboard/types';
import { formatMoney, formatMoneyCompact } from '@/lib/money';
import { classMerge } from '@/lib/utils';

const formatValue = (cents: number) => formatMoney(cents);

/** Dentro de um mês só o dia basta; em período maior, o dia precisa do mês. */
export function dayLabel(date: string, withMonth: boolean) {
  return withMonth ? `${date.slice(8)}/${date.slice(5, 7)}` : date.slice(8);
}

/**
 * De quantos em quantos dias mostrar o rótulo do eixo. Com um mês inteiro, 30
 * marcas viram uma parede de números: mostramos cerca de oito.
 */
export function tickStep(count: number) {
  return count <= 10 ? 1 : Math.ceil(count / 8);
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
 * **ECharts**, o único gráfico do Naency que não usa Recharts). Sobe quando
 * entra mais do que sai; cruzar o zero é o sinal de que o período está no
 * vermelho — por isso a cor acompanha o fim da linha.
 *
 * Decorativo para leitores de tela: o bloco entrega os mesmos números em texto.
 */
export function CashflowChart({ points, className }: CashflowChartProps) {
  const withMonth = spansMoreThanOneMonth(points);
  const isNegative = (points.at(-1)?.cumulativeCents ?? 0) < 0;
  const data = points.map((point) => ({ day: dayLabel(point.date, withMonth), balance: point.cumulativeCents }));
  // O token já troca sozinho no escuro, e a lib re-resolve as cores ao mudar o tema.
  const config = {
    balance: {
      label: 'Sobrou até aqui',
      colors: {
        light: [isNegative ? 'var(--color-icon-finance-expense)' : 'var(--color-icon-finance-income)'],
      },
      formatValue,
    },
  } satisfies ChartConfig;

  return (
    <div aria-hidden data-testid="cashflow-chart" className={classMerge('h-56', className)}>
      <EChartsAreaChart
        data={data}
        config={config}
        className="h-full w-full"
        xDataKey="day"
        curveType="monotone"
        // Sem a animação de entrada: a captura da regressão visual tem de ser igual toda vez.
        animation={false}
      >
        <EChartsAreaChart.Grid />
        <EChartsAreaChart.XAxis
          dataKey="day"
          hideDots
          tickFormatter={(value, index) => (index % tickStep(data.length) === 0 ? value : '')}
        />
        {/* Milhares bastam no eixo: o valor exato sai no tooltip. */}
        <EChartsAreaChart.YAxis tickFormatter={(value: number) => formatMoneyCompact(value)} hideDots />
        <EChartsAreaChart.Tooltip />
        <EChartsAreaChart.Area dataKey="balance" variant="gradient" strokeVariant="solid" strokeWidth={2}>
          <EChartsAreaChart.ActiveDot variant="default" />
        </EChartsAreaChart.Area>
      </EChartsAreaChart>
    </div>
  );
}
