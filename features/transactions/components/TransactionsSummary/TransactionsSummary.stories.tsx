import { TransactionsSummary } from '@/features/transactions/components/TransactionsSummary';
import type { TransactionsPage } from '@/features/transactions/types';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const expenseTotals: TransactionsPage['totals'] = {
  incomeCents: 0,
  expenseCents: -1_444_951,
  pending: { cents: -680_451, count: 15 },
  paid: { cents: -764_500, count: 7 },
};

const meta: Meta<typeof TransactionsSummary> = {
  title: 'Features/Transactions/TransactionsSummary',
  component: TransactionsSummary,
  args: { kind: 'expense', totals: expenseTotals },
  render: (args) => (
    <div className="max-w-4xl">
      <TransactionsSummary {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof TransactionsSummary>;

export const Expenses: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('A pagar')).toBeInTheDocument();
    await expect(canvas.getByText('R$ 6.804,51')).toBeInTheDocument();
    await expect(canvas.getByText('15 despesas pendentes')).toBeInTheDocument();
    await expect(canvas.getByText('R$ 7.645,00')).toBeInTheDocument();
    await expect(canvas.getByText('7 despesas pagas')).toBeInTheDocument();
    await expect(canvas.getByText('R$ 14.449,51')).toBeInTheDocument();
    await expect(canvas.getByText('22 despesas no período')).toBeInTheDocument();
  },
};

export const Incomes: Story = {
  args: {
    kind: 'income',
    totals: { incomeCents: 950_000, expenseCents: 0, pending: { cents: 100_000, count: 1 }, paid: { cents: 850_000, count: 1 } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('A receber')).toBeInTheDocument();
    await expect(canvas.getByText('1 receita pendente')).toBeInTheDocument();
    await expect(canvas.getByText('Recebidas')).toBeInTheDocument();
    await expect(canvas.getByText('R$ 9.500,00')).toBeInTheDocument();
  },
};

export const AllKindsPositive: Story = {
  args: {
    kind: null,
    totals: { incomeCents: 850_000, expenseCents: -52_990, pending: { cents: 0, count: 0 }, paid: { cents: 0, count: 0 } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const resultado = canvas.getByText('+R$ 7.970,10');
    await expect(resultado).toBeInTheDocument();
    // Sobrou: verde, como as receitas.
    await expect(resultado).toHaveClass('text-typography-finance-income');
    await expect(canvas.getByText('-R$ 529,90')).toBeInTheDocument();
  },
};

export const AllKindsNegative: Story = {
  args: {
    kind: null,
    totals: { incomeCents: 100_000, expenseCents: -250_000, pending: { cents: 0, count: 0 }, paid: { cents: 0, count: 0 } },
  },
  play: async ({ canvasElement }) => {
    const resultado = within(canvasElement).getByText('-R$ 1.500,00');
    await expect(resultado).toBeInTheDocument();
    // Faltou: vermelho.
    await expect(resultado).toHaveClass('text-typography-finance-expense');
  },
};

export const Loading: Story = {
  args: { isLoading: true },
};
