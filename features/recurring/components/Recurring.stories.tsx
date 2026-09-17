import { Button } from '@/components/ui/Button';
import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import { categoriesFixture, categoryFixtureId } from '@/features/categories/fixtures/categories';
import { RecurringRuleFormDialog } from '@/features/recurring/components/RecurringRuleFormDialog';
import { RecurringRulesList } from '@/features/recurring/components/RecurringRulesList';
import { recurringFixture } from '@/features/recurring/fixtures/recurring';
import { type RecurringFormState, parseRecurringForm } from '@/features/recurring/schemas';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta = { title: 'Features/Recurring' };
export default meta;
type Story = StoryObj;

const handlers = {
  onCreate: fn(),
  onEdit: fn(),
  onDelete: fn(),
  onActiveChange: fn(async () => {}),
};

export const List: Story = {
  render: () => (
    <div className="max-w-3xl">
      <RecurringRulesList rules={recurringFixture} canEdit {...handlers} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Todo mês · Nubank · próxima 10/10/2026')).toBeInTheDocument();
    await expect(canvas.getByText('Todo mês · Nubank · pausada')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('switch', { name: 'Pausar Aluguel' }));
    await expect(handlers.onActiveChange).toHaveBeenCalledWith(recurringFixture[0], false);
    await userEvent.click(canvas.getByRole('button', { name: 'Excluir Academia' }));
    await expect(handlers.onDelete).toHaveBeenCalledWith(recurringFixture[2]);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const EmptyViewer: Story = {
  render: () => <RecurringRulesList rules={[]} canEdit={false} {...handlers} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Nenhuma recorrência')).toBeInTheDocument();
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
  },
};

async function fakeSave(_state: RecurringFormState, formData: FormData): Promise<RecurringFormState> {
  await new Promise((resolve) => setTimeout(resolve, 30));
  const parsed = parseRecurringForm(formData);
  return parsed.success ? { status: 'saved' } : parsed;
}

const action = fn(fakeSave);

export const CreateRule: Story = {
  render: function Render() {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir</Button>
        <RecurringRuleFormDialog
          open={open}
          onOpenChange={setOpen}
          accounts={accountsFixture}
          categories={categoriesFixture}
          action={action}
          today="2026-09-16"
        />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Abrir' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Nova recorrência' }));
    await userEvent.type(dialog.getByLabelText('Descrição'), 'Aluguel');
    await userEvent.type(dialog.getByLabelText('Valor'), '200000');
    await userEvent.click(dialog.getByLabelText('Conta'));
    await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: /Nubank/ }));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await userEvent.click(dialog.getByLabelText('Categoria'));
    await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'Aluguel' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await userEvent.click(dialog.getByRole('button', { name: 'Criar recorrência' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const formData = action.mock.calls[action.mock.calls.length - 1]?.[1] as FormData;
    await expect(Object.fromEntries(formData)).toMatchObject({
      kind: 'expense',
      frequency: 'monthly',
      amountCents: '200000',
      startDate: '2026-09-16',
      endDate: '',
      categoryId: categoryFixtureId('Moradia/Aluguel'),
    });
  },
};
