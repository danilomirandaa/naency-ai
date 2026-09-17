'use client';

import { MoneyValue } from '@/components/finance/MoneyValue';
import { Text } from '@/components/ui/Text';
import { EvilPieChart } from '@/components/evilcharts/charts/recharts-pie-chart';
import type { ChartConfig } from '@/components/evilcharts/ui/recharts-chart';
import { formatMoney } from '@/lib/money';
import { classMerge } from '@/lib/utils';

export type DonutSlice = {
  name: string;
  /** Cor da categoria; sem cor, usa o neutro. */
  color: string | null;
  valueCents: number;
};

export type CategoryDonutProps = {
  slices: DonutSlice[];
  className?: string;
};

const NEUTRAL = 'var(--color-icon-neutral-rest)';
const formatValue = (cents: number) => formatMoney(cents);

/**
 * Rosca das despesas por categoria, com o total no centro. Decorativa para
 * leitores de tela: a lista de categorias ao lado traz os mesmos valores.
 */
export function CategoryDonut({ slices, className }: CategoryDonutProps) {
  // O EvilCharts monta ids de SVG e variáveis CSS com a chave da fatia, então
  // a chave é um índice, e o nome (com espaço e acento) fica só no rótulo.
  const visible = slices.filter((slice) => slice.valueCents > 0);
  const config: ChartConfig = Object.fromEntries(
    visible.map((slice, index) => [
      `slice${index}`,
      { label: slice.name, colors: { light: [slice.color ?? NEUTRAL] }, formatValue },
    ]),
  );
  const data = visible.map((slice, index) => ({ key: `slice${index}`, value: slice.valueCents }));
  const total = visible.reduce((sum, slice) => sum + slice.valueCents, 0);

  return (
    <div aria-hidden data-testid="category-donut" className={classMerge('relative size-44', className)}>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <Text size="xs" color="secondary">
          Total
        </Text>
        <MoneyValue cents={total} kind="neutral" size="sm" className="font-medium tabular-nums" />
      </div>
      <EvilPieChart
        data={data}
        config={config}
        dataKey="value"
        nameKey="key"
        className="aspect-square size-full"
        chartProps={{ accessibilityLayer: false }}
      >
        <EvilPieChart.Pie
          innerRadius="70%"
          outerRadius="100%"
          paddingAngle={2}
          cornerRadius={4}
          // O gráfico é aria-hidden: nada dentro dele pode receber foco.
          pieProps={{ isAnimationActive: 'auto', rootTabIndex: -1 }}
        />
        <EvilPieChart.Tooltip />
      </EvilPieChart>
    </div>
  );
}
