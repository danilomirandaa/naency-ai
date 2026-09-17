import { TransactionsSummary } from '@/features/transactions/components/TransactionsSummary';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof TransactionsSummary> = {
  title: 'Features/Transactions/TransactionsSummary',
  component: TransactionsSummary,
  render: (args) => (
    <div className="max-w-3xl">
      <TransactionsSummary {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof TransactionsSummary>;

export const Positive: Story = {
  args: { incomeCents: 850_000, expenseCents: -52_990 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('+R$ 7.970,10')).toBeInTheDocument();
    await expect(canvas.getByText('-R$ 529,90')).toBeInTheDocument();
  },
};

export const Negative: Story = {
  args: { incomeCents: 100_000, expenseCents: -250_000 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('-R$ 1.500,00')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: { incomeCents: 0, expenseCents: 0, isLoading: true },
};
