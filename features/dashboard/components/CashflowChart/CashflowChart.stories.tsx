import { CashflowChart, dayLabel, spansMoreThanOneMonth } from '@/features/dashboard/components/CashflowChart';
import { cashflowFixture, cashflowNegativeFixture } from '@/features/dashboard/fixtures/dashboard';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof CashflowChart> = {
  title: 'Features/Dashboard/CashflowChart',
  component: CashflowChart,
  args: { points: cashflowFixture },
  decorators: [
    (Story) => (
      <div className="max-w-2xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof CashflowChart>;

export const Positive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // O gráfico é decorativo: quem lê tela recebe os números pela tabela do bloco.
    const chart = canvas.getByTestId('cashflow-chart');
    await expect(chart).toHaveAttribute('aria-hidden', 'true');
    await expect(chart.querySelectorAll('svg').length).toBeGreaterThan(0);
  },
};

export const Negative: Story = {
  args: { points: cashflowNegativeFixture },
};

export const SingleDay: Story = {
  args: {
    points: [{ date: '2026-09-18', incomeCents: 50_000, expenseCents: -12_000, cumulativeCents: 38_000 }],
  },
  play: async () => {
    // Dentro de um mês só o dia aparece; atravessando meses, o rótulo leva o mês.
    await expect(spansMoreThanOneMonth([])).toBe(false);
    await expect(dayLabel('2026-09-18', false)).toBe('18');
    await expect(dayLabel('2026-09-18', true)).toBe('18/09');
    await expect(
      spansMoreThanOneMonth([
        { date: '2026-08-31', incomeCents: 0, expenseCents: 0, cumulativeCents: 0 },
        { date: '2026-09-01', incomeCents: 0, expenseCents: 0, cumulativeCents: 0 },
      ]),
    ).toBe(true);
  },
};
