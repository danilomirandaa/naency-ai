import { Button } from '@/components/ui/Button';
import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import { categoriesFixture, categoryFixtureId } from '@/features/categories/fixtures/categories';
import { TransactionFormDialog } from '@/features/transactions/components/TransactionFormDialog';
import { transactionsFixture } from '@/features/transactions/fixtures/transactions';
import { type TransactionFormState, parseTransactionForm } from '@/features/transactions/schemas';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const [nubank, reserva, carteira] = accountsFixture.map((account) => account.id) as [string, string, string];

async function fakeSave(_state: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const parsed = parseTransactionForm(formData);
  return 'success' in parsed ? { status: 'saved', transactionId: 'novo' } : parsed;
}

const meta: Meta<typeof TransactionFormDialog> = {
  title: 'Features/Transactions/TransactionFormDialog',
  component: TransactionFormDialog,
  args: {
    accounts: accountsFixture,
    categories: categoriesFixture,
    action: fn(fakeSave),
    onSaved: fn(),
    today: '2026-09-16',
  },
  render: function Render(args) {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir</Button>
        <TransactionFormDialog {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
};

export default meta;

type Story = StoryObj<typeof TransactionFormDialog>;

async function openDialog(canvasElement: HTMLElement, name: string) {
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Abrir' }));
  return within(await screen.findByRole('dialog', { name }));
}

async function choose(dialog: ReturnType<typeof within>, label: string, option: RegExp | string) {
  await userEvent.click(dialog.getByLabelText(label));
  await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: option }));
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
}

function lastFormData(action: unknown) {
  const calls = (action as ReturnType<typeof fn>).mock.calls;
  return Object.fromEntries(calls[calls.length - 1]?.[1] as FormData);
}

export const CreateExpense: Story = {
  args: { defaultAccountId: nubank },
  play: async ({ canvasElement, args }) => {
    const dialog = await openDialog(canvasElement, 'Novo lançamento');
    await expect(dialog.getByRole('tab', { name: 'Despesa' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.type(dialog.getByLabelText('Valor'), '4590');
    await userEvent.type(dialog.getByLabelText('Descrição'), 'Padaria');
    await choose(dialog, 'Categoria', 'Padaria e café');
    await userEvent.click(dialog.getByRole('switch'));
    await expect(dialog.getByText('Fica como previsto, fora do saldo.')).toBeInTheDocument();
    await userEvent.click(dialog.getByRole('button', { name: 'Lançar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(args.onSaved).toHaveBeenCalledWith('novo');
    await expect(lastFormData(args.action)).toEqual({
      kind: 'expense',
      status: 'planned',
      // Previsto: sem "pago em"; forma de pagamento não informada.
      paymentMethod: '',
      amountCents: '4590',
      date: '2026-09-16',
      description: 'Padaria',
      accountId: nubank,
      categoryId: categoryFixtureId('Alimentação/Padaria e café'),
      notes: '',
      installments: '1',
    });
  },
};

export const CreateTransfer: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await openDialog(canvasElement, 'Novo lançamento');
    await userEvent.click(dialog.getByRole('tab', { name: 'Transferência' }));
    await expect(dialog.queryByLabelText('Categoria')).toBeNull();
    await userEvent.type(dialog.getByLabelText('Valor'), '100000');
    await userEvent.type(dialog.getByLabelText('Descrição'), 'Reserva');
    await choose(dialog, 'De', /Nubank/);
    await userEvent.click(dialog.getByLabelText('Para'));
    const listbox = within(await screen.findByRole('listbox'));
    // A origem não aparece como destino.
    await expect(listbox.queryByRole('option', { name: /Nubank/ })).toBeNull();
    await userEvent.click(listbox.getByRole('option', { name: /Reserva de emergência/ }));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await userEvent.click(dialog.getByRole('button', { name: 'Lançar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(lastFormData(args.action)).toMatchObject({
      kind: 'transfer',
      status: 'cleared',
      amountCents: '100000',
      accountId: nubank,
      toAccountId: reserva,
    });
  },
};

export const ValidationKeepsValues: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement, 'Novo lançamento');
    await userEvent.click(dialog.getByRole('tab', { name: 'Receita' }));
    await userEvent.type(dialog.getByLabelText('Descrição'), 'Freela');
    await userEvent.click(dialog.getByRole('button', { name: 'Lançar' }));

    await expect(await dialog.findByRole('alert')).toHaveTextContent('Revise os campos destacados.');
    await expect(dialog.getByLabelText('Valor')).toHaveAccessibleDescription('Informe o valor.');
    await expect(dialog.getByLabelText('Conta')).toHaveAttribute('aria-invalid', 'true');
    await expect(dialog.getByRole('tab', { name: 'Receita' })).toHaveAttribute('aria-selected', 'true');
    await expect(dialog.getByLabelText('Descrição')).toHaveValue('Freela');
    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const EditIncomingTransferLeg: Story = {
  args: {
    transaction: {
      ...(transactionsFixture[2] as (typeof transactionsFixture)[number]),
      amountCents: 100_000,
      account: {
        id: reserva,
        name: 'Reserva de emergência',
        type: 'investment',
        institution: null,
      },
      transfer: { counterpartAccountId: nubank, counterpartAccountName: 'Nubank' },
    },
  },
  play: async ({ canvasElement, args }) => {
    const dialog = await openDialog(canvasElement, 'Editar lançamento');
    // Editada sempre como origem → destino, mesmo aberta pela perna de entrada.
    await expect(dialog.getByLabelText('De')).toHaveTextContent('Nubank');
    await expect(dialog.getByLabelText('Para')).toHaveTextContent('Reserva de emergência');
    await expect(dialog.getByLabelText('Valor')).toHaveValue('1.000,00');
    await choose(dialog, 'Para', /Carteira/);
    await userEvent.click(dialog.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(lastFormData(args.action)).toMatchObject({ accountId: nubank, toAccountId: carteira, amountCents: '100000' });
  },
};
