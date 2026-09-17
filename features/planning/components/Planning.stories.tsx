import { Button } from '@/components/ui/Button';
import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import { BudgetDialog } from '@/features/planning/components/BudgetDialog';
import { BudgetsList } from '@/features/planning/components/BudgetsList';
import { GoalFormDialog } from '@/features/planning/components/GoalFormDialog';
import { GoalsList } from '@/features/planning/components/GoalsList';
import { budgetsFixture, goalsFixture } from '@/features/planning/fixtures/planning';
import type { GoalFormState } from '@/features/planning/schemas';
import type { BudgetLine } from '@/features/planning/types';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta = { title: 'Features/Planning' };
export default meta;
type Story = StoryObj;

const onEdit = fn();

export const Budgets: Story = {
  render: () => (
    <div className="max-w-2xl">
      <BudgetsList lines={budgetsFixture} canEdit onEdit={onEdit} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Passou/)).toHaveTextContent('Passou R$ 324,50 do orçado');
    await expect(canvas.getByRole('meter', { name: 'Orçamento de Mercado' })).toHaveAttribute('aria-valuenow', '100');
    await userEvent.click(canvas.getByRole('button', { name: 'Definir orçamento de Educação' }));
    await expect(onEdit).toHaveBeenCalledWith(budgetsFixture[3]);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

const onSave = fn(async () => ({ ok: true as const }));

export const EditBudget: Story = {
  render: function Render() {
    const [line, setLine] = React.useState<BudgetLine | null>(null);
    return (
      <>
        <Button onClick={() => setLine(budgetsFixture[0] as BudgetLine)}>Abrir</Button>
        <BudgetDialog line={line} onOpenChange={(open) => !open && setLine(null)} onSave={onSave} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Abrir' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Orçamento de Moradia' }));
    const input = dialog.getByLabelText('Valor por mês');
    await expect(input).toHaveValue('2.500,00');
    await userEvent.clear(input);
    await userEvent.type(input, '300000');
    await userEvent.click(dialog.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(onSave).toHaveBeenCalledWith(budgetsFixture[0], 300_000);
  },
};

const onRemove = fn(async () => ({ ok: true as const }));

export const RemoveBudget: Story = {
  render: function Render() {
    const [line, setLine] = React.useState<BudgetLine | null>(null);
    return (
      <>
        <Button onClick={() => setLine(budgetsFixture[0] as BudgetLine)}>Abrir</Button>
        <BudgetDialog line={line} onOpenChange={(open) => !open && setLine(null)} onSave={onRemove} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Abrir' }));
    const budget = within(await screen.findByRole('dialog', { name: 'Orçamento de Moradia' }));
    await userEvent.click(budget.getByRole('button', { name: 'Remover' }));
    // Remover pede confirmação antes de apagar o orçamento.
    const confirm = within(await screen.findByRole('dialog', { name: 'Remover orçamento' }));
    await expect(onRemove).not.toHaveBeenCalled();
    await userEvent.click(confirm.getByRole('button', { name: 'Remover' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(onRemove).toHaveBeenCalledWith(budgetsFixture[0], null);
  },
};

const goalHandlers = { onCreate: fn(), onEdit: fn(), onDelete: fn() };

export const Goals: Story = {
  render: () => (
    <div className="max-w-3xl">
      <GoalsList goals={goalsFixture} canEdit {...goalHandlers} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Guarde/)).toHaveTextContent('Guarde R$ 2.083,34 por mês para chegar na data.');
    await expect(canvas.getByText('Meta alcançada 🎉')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Excluir Viagem' }));
    await expect(goalHandlers.onDelete).toHaveBeenCalledWith(goalsFixture[1]);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const GoalsEmpty: Story = {
  render: () => <GoalsList goals={[]} canEdit {...goalHandlers} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Nova meta' }));
    await expect(goalHandlers.onCreate).toHaveBeenCalled();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

const goalAction = fn(async (_state: GoalFormState, formData: FormData): Promise<GoalFormState> => {
  const name = String(formData.get('name') ?? '');
  return name
    ? { status: 'saved' }
    : {
        status: 'error',
        message: 'Revise os campos destacados.',
        fieldErrors: { name: 'Dê um nome à meta.' },
        values: { name: '', targetCents: '', accountId: '', targetDate: '' },
      };
});

export const CreateGoal: Story = {
  render: function Render() {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir</Button>
        <GoalFormDialog open={open} onOpenChange={setOpen} accounts={accountsFixture} action={goalAction} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Abrir' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Nova meta' }));
    await userEvent.click(dialog.getByRole('button', { name: 'Criar meta' }));
    await expect(await dialog.findByRole('alert')).toHaveTextContent('Revise os campos destacados.');
    await userEvent.type(dialog.getByLabelText('Nome'), 'Viagem');
    await userEvent.type(dialog.getByLabelText('Valor da meta'), '1000000');
    await userEvent.click(dialog.getByRole('button', { name: 'Criar meta' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const formData = goalAction.mock.calls[goalAction.mock.calls.length - 1]?.[1] as FormData;
    await expect(Object.fromEntries(formData)).toMatchObject({ name: 'Viagem', targetCents: '1000000' });
  },
};
