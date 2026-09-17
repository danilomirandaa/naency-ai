import { Button } from '@/components/ui/Button';
import { AccountFormDialog } from '@/features/accounts/components/AccountFormDialog';
import { accountsFixture, institutionsFixture } from '@/features/accounts/fixtures/accounts';
import { type AccountFormState, parseAccountForm } from '@/features/accounts/schemas';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

/** Imita a Server Action: valida com o mesmo schema e recusa um nome. */
async function fakeSave(_state: AccountFormState, formData: FormData): Promise<AccountFormState> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const parsed = parseAccountForm(formData);
  if (!('success' in parsed)) {
    return parsed;
  }
  if (parsed.data.name === 'Proibida') {
    return {
      status: 'error',
      message: 'Seu papel neste espaço não permite editar contas.',
      fieldErrors: {},
      values: {
        ...parsed.data,
        institutionId: parsed.data.institutionId ?? '',
      },
    };
  }
  return { status: 'saved', accountId: 'nova' };
}

const meta: Meta<typeof AccountFormDialog> = {
  title: 'Features/Accounts/AccountFormDialog',
  component: AccountFormDialog,
  args: {
    institutions: institutionsFixture,
    action: fn(fakeSave),
    onSaved: fn(),
    today: '2026-09-16',
  },
  render: function Render(args) {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir</Button>
        <AccountFormDialog {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
};

export default meta;

type Story = StoryObj<typeof AccountFormDialog>;

async function openDialog(canvasElement: HTMLElement, name: string) {
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Abrir' }));
  return within(await screen.findByRole('dialog', { name }));
}

function lastFormData(action: unknown) {
  const calls = (action as ReturnType<typeof fn>).mock.calls;
  return calls[calls.length - 1]?.[1] as FormData;
}

export const Create: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await openDialog(canvasElement, 'Nova conta');
    await expect(dialog.getByLabelText('Data do saldo')).toHaveValue('2026-09-16');

    await userEvent.type(dialog.getByLabelText('Nome'), 'Nubank');
    await userEvent.selectOptions(dialog.getByLabelText('Tipo'), 'checking');
    await userEvent.selectOptions(dialog.getByLabelText('Instituição'), 'Nubank');
    await userEvent.type(dialog.getByLabelText('Saldo inicial'), '-1.500,75');
    await userEvent.click(dialog.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(args.onSaved).toHaveBeenCalledWith('nova');
    const formData = lastFormData(args.action);
    await expect(Object.fromEntries(formData)).toEqual({
      name: 'Nubank',
      type: 'checking',
      institutionId: '22222222-2222-4222-8222-222222222222',
      initialBalanceCents: '-150075',
      initialBalanceDate: '2026-09-16',
    });
  },
};

export const ValidationKeepsValues: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await openDialog(canvasElement, 'Nova conta');
    await userEvent.type(dialog.getByLabelText('Saldo inicial'), '10');
    await userEvent.click(dialog.getByRole('button', { name: 'Criar conta' }));

    await expect(await dialog.findByRole('alert')).toHaveTextContent('Revise os campos destacados.');
    await expect(dialog.getByLabelText('Nome')).toHaveAccessibleDescription('Dê um nome à conta.');
    await expect(dialog.getByLabelText('Tipo')).toBeInvalid();
    // O React limpa o formulário depois da action; os valores voltam do estado.
    await expect(dialog.getByLabelText('Saldo inicial')).toHaveValue('10,00');
    await expect(args.onSaved).not.toHaveBeenCalled();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const ServerError: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement, 'Nova conta');
    await userEvent.type(dialog.getByLabelText('Nome'), 'Proibida');
    await userEvent.selectOptions(dialog.getByLabelText('Tipo'), 'cash');
    await userEvent.click(dialog.getByRole('button', { name: 'Criar conta' }));

    await expect(await dialog.findByRole('alert')).toHaveTextContent(
      'Seu papel neste espaço não permite editar contas.',
    );
    await expect(dialog.getByLabelText('Nome')).toHaveValue('Proibida');
    await expect(dialog.getByLabelText('Tipo')).toHaveValue('cash');
    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const Edit: Story = {
  args: { account: accountsFixture[1] },
  play: async ({ canvasElement, args }) => {
    const dialog = await openDialog(canvasElement, 'Editar conta');
    await expect(dialog.getByLabelText('Nome')).toHaveValue('Reserva de emergência');
    await expect(dialog.getByLabelText('Tipo')).toHaveValue('investment');
    await expect(dialog.getByLabelText('Instituição')).toHaveValue(
      '33333333-3333-4333-8333-333333333333',
    );
    await expect(dialog.getByLabelText('Saldo inicial')).toHaveValue('25.000,00');
    await expect(dialog.getByLabelText('Data do saldo')).toHaveValue('2026-09-01');

    await userEvent.click(dialog.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(lastFormData(args.action).get('initialBalanceCents')).toBe('2500000');
  },
};

export const ReopensClean: Story = {
  play: async ({ canvasElement }) => {
    let dialog = await openDialog(canvasElement, 'Nova conta');
    await userEvent.type(dialog.getByLabelText('Nome'), 'Rascunho');
    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    dialog = await openDialog(canvasElement, 'Nova conta');
    await expect(dialog.getByLabelText('Nome')).toHaveValue('');
    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};
