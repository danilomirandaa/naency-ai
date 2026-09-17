import { MoneyValue } from '@/components/finance/MoneyValue';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof MoneyValue> = {
  title: 'Finance/MoneyValue',
  component: MoneyValue,
  args: { cents: 123456, size: 'lg' },
};

export default meta;

type Story = StoryObj<typeof MoneyValue>;

export const Default: Story = {};

export const Kinds: Story = {
  render: () => (
    <div className="flex flex-col gap-2 text-sm">
      <MoneyValue cents={850000} kind="income" showPlusSign />
      <MoneyValue cents={-34290} kind="expense" />
      <MoneyValue cents={-120000} kind="transfer" />
      <MoneyValue cents={0} />
      <MoneyValue cents={-4550} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // O Testing Library normaliza o espaço não separável do Intl para espaço comum.
    await expect(canvas.getByText('+R$ 8.500,00')).toHaveClass('text-typography-finance-income');
    await expect(canvas.getByText('-R$ 342,90')).toHaveClass('text-typography-finance-expense');
    // Sem kind, negativo fica vermelho.
    await expect(canvas.getByText('-R$ 45,50')).toHaveClass('text-typography-finance-expense');
    await expect(canvas.getByText('R$ 0,00')).toHaveClass('text-typography-neutral-primary');
  },
};
