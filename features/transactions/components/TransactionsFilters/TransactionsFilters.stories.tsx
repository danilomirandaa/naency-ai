import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import { categoriesFixture, categoryFixtureId } from '@/features/categories/fixtures/categories';
import { TransactionsFilters } from '@/features/transactions/components/TransactionsFilters';
import type { TransactionFilters } from '@/features/transactions/filters';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const base: TransactionFilters = {
  from: '2026-09-01',
  to: '2026-09-30',
  accountId: null,
  categoryId: null,
  kind: null,
  search: '',
  page: 1,
};

const onChange = fn();

function Demo({ initial, overdueCount = 0 }: { initial: TransactionFilters; overdueCount?: number }) {
  const [filters, setFilters] = React.useState(initial);
  return (
    <TransactionsFilters
      filters={filters}
      accounts={accountsFixture}
      categories={categoriesFixture}
      overdueCount={overdueCount}
      onChange={(changes) => {
        onChange(changes);
        setFilters((current) => ({ ...current, ...changes, page: 1 }));
      }}
    />
  );
}

const meta: Meta = {
  title: 'Features/Transactions/TransactionsFilters',
  beforeEach: () => {
    onChange.mockClear();
  },
};

export default meta;

type Story = StoryObj;

export const ChangeFilters: Story = {
  render: () => <Demo initial={base} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByLabelText('Filtrar por categoria'));
    await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'Mercado' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await expect(onChange).toHaveBeenLastCalledWith({ categoryId: categoryFixtureId('Mercado') });

    await userEvent.type(canvas.getByLabelText('Buscar na descrição'), 'padaria{Enter}');
    await expect(onChange).toHaveBeenLastCalledWith({ search: 'padaria' });

    await userEvent.click(canvas.getByRole('button', { name: 'Limpar filtros' }));
    await expect(onChange).toHaveBeenLastCalledWith({ accountId: null, categoryId: null, search: '', situation: null });
    await expect(canvas.getByLabelText('Buscar na descrição')).toHaveValue('');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const SituationChips: Story = {
  render: () => <Demo initial={{ ...base, kind: 'expense' }} overdueCount={13} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = within(canvas.getByRole('tablist', { name: 'Situação' }));
    await expect(group.getByRole('tab', { name: 'Todas' })).toHaveAttribute('aria-selected', 'true');
    // Atrasadas mostra quantas são, mesmo fora do período.
    const overdue = group.getByRole('tab', { name: 'Atrasadas 13' });
    await userEvent.click(overdue);
    await expect(onChange).toHaveBeenLastCalledWith({ situation: 'overdue' });
    await expect(overdue).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByText('Vencidas e não pagas, de qualquer mês')).toBeInTheDocument();
    await userEvent.click(group.getByRole('tab', { name: 'A pagar' }));
    await expect(onChange).toHaveBeenLastCalledWith({ situation: 'pending' });
    await userEvent.click(group.getByRole('tab', { name: 'Pagas' }));
    await expect(onChange).toHaveBeenLastCalledWith({ situation: 'paid' });
    await userEvent.click(canvas.getByRole('button', { name: 'Limpar filtros' }));
    await expect(group.getByRole('tab', { name: 'Todas' })).toHaveAttribute('aria-selected', 'true');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const IncomeLabels: Story = {
  render: () => <Demo initial={{ ...base, kind: 'income' }} />,
  play: async ({ canvasElement }) => {
    const group = within(within(canvasElement).getByRole('tablist', { name: 'Situação' }));
    await expect(group.getByRole('tab', { name: 'A receber' })).toBeInTheDocument();
    await expect(group.getByRole('tab', { name: 'Recebidas' })).toBeInTheDocument();
    await expect(group.getByRole('tab', { name: 'Atrasadas' })).toBeInTheDocument();
  },
};

export const TransfersHideCategory: Story = {
  render: () => <Demo initial={{ ...base, kind: 'transfer' }} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByLabelText('Filtrar por categoria')).toBeNull();
  },
};
