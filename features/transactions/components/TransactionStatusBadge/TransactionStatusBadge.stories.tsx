import { TransactionStatusBadge } from '@/features/transactions/components/TransactionStatusBadge';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof TransactionStatusBadge> = {
  title: 'Features/Transactions/TransactionStatusBadge',
  component: TransactionStatusBadge,
};

export default meta;

type Story = StoryObj<typeof TransactionStatusBadge>;

const today = '2026-09-17';

export const AllSituations: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(['expense', 'income', 'transfer'] as const).map((kind) => (
        <div key={kind} className="flex items-center gap-2">
          <TransactionStatusBadge kind={kind} status="planned" date="2026-09-10" today={today} />
          <TransactionStatusBadge kind={kind} status="planned" date="2026-09-17" today={today} />
          <TransactionStatusBadge kind={kind} status="cleared" date="2026-09-10" today={today} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('Atrasada')).toHaveLength(3);
    // Vence hoje ainda não está atrasada.
    await expect(canvas.getByText('A pagar')).toBeInTheDocument();
    await expect(canvas.getByText('Paga')).toBeInTheDocument();
    await expect(canvas.getByText('A receber')).toBeInTheDocument();
    await expect(canvas.getByText('Recebida')).toBeInTheDocument();
    await expect(canvas.getByText('Prevista')).toBeInTheDocument();
    await expect(canvas.getByText('Efetivada')).toBeInTheDocument();
  },
};
