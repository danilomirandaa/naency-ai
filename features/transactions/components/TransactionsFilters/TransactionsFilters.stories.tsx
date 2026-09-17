import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import { categoriesFixture, categoryFixtureId } from '@/features/categories/fixtures/categories';
import { TransactionsFilters } from '@/features/transactions/components/TransactionsFilters';
import type { TransactionFilters } from '@/features/transactions/filters';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const base: TransactionFilters = {
  month: '2026-09',
  accountId: null,
  categoryId: null,
  kind: null,
  search: '',
  page: 1,
};

const onChange = fn();

function Demo({ initial }: { initial: TransactionFilters }) {
  const [filters, setFilters] = React.useState(initial);
  return (
    <TransactionsFilters
      filters={filters}
      accounts={accountsFixture}
      categories={categoriesFixture}
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
    await userEvent.click(canvas.getByRole('button', { name: 'Mês anterior' }));
    await expect(onChange).toHaveBeenLastCalledWith({ month: '2026-08' });

    await userEvent.click(canvas.getByLabelText('Filtrar por categoria'));
    await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'Mercado' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await expect(onChange).toHaveBeenLastCalledWith({ categoryId: categoryFixtureId('Mercado') });

    await userEvent.type(canvas.getByLabelText('Buscar na descrição'), 'padaria{Enter}');
    await expect(onChange).toHaveBeenLastCalledWith({ search: 'padaria' });

    await userEvent.click(canvas.getByRole('button', { name: 'Limpar filtros' }));
    await expect(onChange).toHaveBeenLastCalledWith({ accountId: null, categoryId: null, search: '' });
    await expect(canvas.getByLabelText('Buscar na descrição')).toHaveValue('');
    await userEvent.click(canvas.getByRole('button', { name: 'Próximo mês' }));
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const TransfersHideCategory: Story = {
  render: () => <Demo initial={{ ...base, kind: 'transfer' }} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByLabelText('Filtrar por categoria')).toBeNull();
  },
};
