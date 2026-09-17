import { EvolutionChart, monthLabel } from '@/features/dashboard/components/EvolutionChart';
import { evolutionFixture } from '@/features/dashboard/fixtures/dashboard';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';

const meta: Meta<typeof EvolutionChart> = {
  title: 'Features/Dashboard/EvolutionChart',
  component: EvolutionChart,
  args: { points: evolutionFixture },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof EvolutionChart>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector('[data-testid="evolution-chart"]') as HTMLElement;
    await expect(chart).toHaveAttribute('aria-hidden', 'true');
    // Duas colunas (receita e despesa) por mês.
    await waitFor(() => expect(chart.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(evolutionFixture.length * 2));
    // Legenda na ordem das séries.
    await expect(chart.querySelector('.recharts-legend-wrapper')).toHaveTextContent(/Receitas.*Despesas/);
    await expect(chart).toHaveTextContent('set');
    await expect(monthLabel('2026-01')).toBe('jan');
  },
};

export const TwelveMonths: Story = {
  args: {
    points: Array.from({ length: 12 }, (_, index) => ({
      month: `2026-${String(index + 1).padStart(2, '0')}`,
      incomeCents: 850_000 + index * 10_000,
      expenseCents: -(500_000 + ((index * 37_000) % 250_000)),
    })),
  },
};
