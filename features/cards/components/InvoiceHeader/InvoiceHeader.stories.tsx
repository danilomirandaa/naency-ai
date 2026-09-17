import { InvoiceHeader } from '@/features/cards/components/InvoiceHeader';
import { invoicesFixture } from '@/features/cards/fixtures/cards';
import type { InvoiceSummary } from '@/features/cards/types';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

const [november, october, september, august] = invoicesFixture as [
  InvoiceSummary,
  InvoiceSummary,
  InvoiceSummary,
  InvoiceSummary,
];

const meta: Meta<typeof InvoiceHeader> = {
  title: 'Features/Cards/InvoiceHeader',
  component: InvoiceHeader,
  args: {
    invoices: invoicesFixture,
    selected: october,
    onSelect: fn(),
    canEdit: true,
    onPay: fn(),
    onUnpay: fn(async () => {}),
  },
  render: (args) => (
    <div className="max-w-3xl">
      <InvoiceHeader {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof InvoiceHeader>;

export const OpenInvoice: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Fatura de outubro de 2026')).toBeInTheDocument();
    await expect(canvas.getByText('R$ 2.384,50')).toBeInTheDocument();
    await expect(canvas.getByText('Fecha 25/09/2026 · vence 05/10/2026')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Fatura anterior' }));
    await expect(args.onSelect).toHaveBeenLastCalledWith(september.referenceMonth);
    await userEvent.click(canvas.getByRole('button', { name: 'Próxima fatura' }));
    await expect(args.onSelect).toHaveBeenLastCalledWith(november.referenceMonth);
    await userEvent.click(canvas.getByRole('button', { name: 'Pagar fatura' }));
    await expect(args.onPay).toHaveBeenCalledOnce();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const PaidInvoice: Story = {
  args: { selected: september },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Paga')).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Pagar fatura' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Desfazer pagamento' }));
    await expect(args.onUnpay).toHaveBeenCalledOnce();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const OldestClosed: Story = {
  args: { selected: august, canEdit: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Fatura anterior' })).toBeDisabled();
    await expect(canvas.getByText('Fechada')).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Pagar fatura' })).toBeNull();
  },
};
