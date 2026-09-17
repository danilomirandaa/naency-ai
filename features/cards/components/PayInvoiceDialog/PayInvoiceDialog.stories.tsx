import { Button } from '@/components/ui/Button';
import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import { PayInvoiceDialog } from '@/features/cards/components/PayInvoiceDialog';
import { invoicesFixture } from '@/features/cards/fixtures/cards';
import { type PayInvoiceState, payInvoiceSchema } from '@/features/cards/schemas';
import type { InvoiceSummary } from '@/features/cards/types';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

async function fakePay(_state: PayInvoiceState, formData: FormData): Promise<PayInvoiceState> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const parsed = payInvoiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Revise os campos destacados.',
      fieldErrors: { fromAccountId: 'Escolha a conta que paga a fatura.' },
    };
  }
  return { status: 'paid' };
}

const meta: Meta<typeof PayInvoiceDialog> = {
  title: 'Features/Cards/PayInvoiceDialog',
  component: PayInvoiceDialog,
  args: {
    invoice: invoicesFixture[1] as InvoiceSummary,
    accounts: accountsFixture,
    defaultAccountId: accountsFixture[0]?.id ?? null,
    today: '2026-10-05',
    action: fn(fakePay),
    onPaid: fn(),
  },
  render: function Render(args) {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir</Button>
        <PayInvoiceDialog {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
};

export default meta;

type Story = StoryObj<typeof PayInvoiceDialog>;

export const PayFullAmount: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Abrir' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Pagar fatura de outubro de 2026' }));
    await expect(dialog.getByLabelText('Pagar com')).toHaveTextContent('Nubank');
    await expect(dialog.getByLabelText('Valor pago')).toHaveValue('2.384,50');
    await userEvent.click(dialog.getByRole('button', { name: 'Confirmar pagamento' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(args.onPaid).toHaveBeenCalledOnce();
    const calls = (args.action as ReturnType<typeof fn>).mock.calls;
    await expect(Object.fromEntries(calls[0]?.[1] as FormData)).toEqual({
      fromAccountId: accountsFixture[0]?.id,
      amountCents: '238450',
      date: '2026-10-05',
    });
  },
};

export const MissingAccount: Story = {
  args: { defaultAccountId: null },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Abrir' }));
    const dialog = within(await screen.findByRole('dialog'));
    await userEvent.click(dialog.getByRole('button', { name: 'Confirmar pagamento' }));
    await expect(await dialog.findByRole('alert')).toHaveTextContent('Revise os campos destacados.');
    await expect(dialog.getByLabelText('Pagar com')).toHaveAttribute('aria-invalid', 'true');
    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};
