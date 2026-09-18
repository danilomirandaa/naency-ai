import { TransactionsTable } from '@/features/transactions/components/TransactionsTable';
import { transactionsFixture } from '@/features/transactions/fixtures/transactions';
import type { TransactionItem } from '@/features/transactions/types';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const [luz, mercado, reserva, padaria, salario] = transactionsFixture as [
  TransactionItem,
  TransactionItem,
  TransactionItem,
  TransactionItem,
  TransactionItem,
];

const escola: TransactionItem = {
  ...luz,
  id: '00000001-0000-4000-8000-000000000099',
  description: 'Escola Catherine',
  amountCents: -96_022,
  date: '2026-09-25',
  paymentMethod: 'boleto',
  recurring: true,
};

const tv: TransactionItem = {
  ...mercado,
  id: '00000001-0000-4000-8000-000000000098',
  description: 'TV (2/10)',
  amountCents: -45_000,
  paymentMethod: 'credit_card',
  notes: null,
  installment: { number: 2, total: 10 },
};

const items = [escola, luz, mercado, tv, reserva, padaria, salario];

const meta: Meta<typeof TransactionsTable> = {
  title: 'Features/Transactions/TransactionsTable',
  component: TransactionsTable,
  args: {
    items,
    today: '2026-09-17',
    canEdit: true,
    onEdit: fn(),
    onDelete: fn(),
    onStatusChange: fn(async () => {}),
    sort: null,
    onSortChange: fn(),
    page: 1,
    total: items.length,
    pageSize: 50,
    onPageChange: fn(),
    emptyMessage: 'Nenhum lançamento neste período',
  },
};

export default meta;

type Story = StoryObj<typeof TransactionsTable>;

export const Editor: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table');
    const rows = within(table).getAllByRole('row');
    await expect(rows).toHaveLength(items.length + 1);

    const row = (description: string) => within(rows.find((item) => within(item).queryAllByText(description).length > 0) as HTMLElement);
    // Situação derivada de hoje: vencida é atrasada; futura, a pagar; efetivada, paga/recebida.
    await expect(row('Conta de luz').getByText('Atrasada')).toBeInTheDocument();
    // Hora do extrato embaixo da data: é ela que ordena o dia.
    await expect(row('Conta de luz').getByText('04:57')).toBeInTheDocument();
    await expect(row('Escola Catherine').getByText('A pagar')).toBeInTheDocument();
    await expect(row('Escola Catherine').getByText('Recorrente')).toBeInTheDocument();
    await expect(row('Escola Catherine').getByText('Boleto')).toBeInTheDocument();
    await expect(row('Supermercado').getByText('Paga')).toBeInTheDocument();
    await expect(row('Supermercado').getByText('Débito')).toBeInTheDocument();
    // Data e "pago em" no mesmo dia.
    await expect(row('Supermercado').getAllByText('15/09/2026')).toHaveLength(2);
    await expect(row('TV (2/10)').getByText('Parcela 2/10')).toBeInTheDocument();
    await expect(row('Salário').getByText('Recebida')).toBeInTheDocument();
    await expect(row('Salário').getByText('+R$ 8.500,00')).toBeInTheDocument();
    await expect(row('Reserva do mês').getByText('Nubank → Reserva de emergência')).toBeInTheDocument();
    await expect(row('Padaria').getByText('Sem categoria')).toBeInTheDocument();
    // Previsto não tem "pago em".
    await expect(row('Conta de luz').getAllByText('Não informado').length).toBeGreaterThan(0);

    // Ordenar pelo cabeçalho (botão, funciona no teclado).
    await expect(within(table).getByRole('columnheader', { name: /Data/ })).toHaveAttribute('aria-sort', 'descending');
    await userEvent.click(within(table).getByRole('button', { name: 'Valor' }));
    await expect(args.onSortChange).toHaveBeenLastCalledWith({ key: 'amount', dir: 'desc' });
    await userEvent.click(within(table).getByRole('button', { name: 'Data' }));
    await expect(args.onSortChange).toHaveBeenLastCalledWith({ key: 'date', dir: 'asc' });

    // Menu de ações: efetivar e excluir (a confirmação fica no container).
    await userEvent.click(row('Conta de luz').getByRole('button', { name: 'Ações de Conta de luz' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Marcar como paga' }));
    await expect(args.onStatusChange).toHaveBeenCalledWith(luz, 'cleared');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());

    await userEvent.click(row('Salário').getByRole('button', { name: 'Ações de Salário' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Marcar como a receber' }));
    await expect(args.onStatusChange).toHaveBeenLastCalledWith(salario, 'planned');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());

    await userEvent.click(row('Supermercado').getByRole('button', { name: 'Ações de Supermercado' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Editar' }));
    await expect(args.onEdit).toHaveBeenCalledWith(mercado);
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());

    await userEvent.click(row('Padaria').getByRole('button', { name: 'Ações de Padaria' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Excluir' }));
    await expect(args.onDelete).toHaveBeenCalledWith(padaria);
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    (document.activeElement as HTMLElement | null)?.blur();
    // O menu da última coluna rola a tabela; a captura volta para o começo.
    for (const element of canvasElement.querySelectorAll<HTMLElement>('*')) {
      element.scrollLeft = 0;
    }
  },
};

export const SortedByAmount: Story = {
  args: { sort: { key: 'amount', dir: 'asc' } },
  play: async ({ canvasElement, args }) => {
    const table = within(within(canvasElement).getByRole('table'));
    await expect(table.getByRole('columnheader', { name: /Valor/ })).toHaveAttribute('aria-sort', 'ascending');
    await expect(table.getByRole('columnheader', { name: /Data/ })).not.toHaveAttribute('aria-sort');
    // Terceiro clique na mesma coluna volta para a ordem padrão.
    await userEvent.click(table.getByRole('button', { name: 'Valor' }));
    await expect(args.onSortChange).toHaveBeenLastCalledWith(null);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Viewer: Story = {
  args: { canEdit: false },
  play: async ({ canvasElement }) => {
    const table = within(within(canvasElement).getByRole('table'));
    await expect(table.queryByRole('button', { name: /Ações de/ })).toBeNull();
  },
};

export const InvoiceColumns: Story = {
  args: { hiddenColumns: ['situation', 'paymentMethod', 'paidAt'], items: [mercado, tv, padaria] , total: 3 },
  play: async ({ canvasElement }) => {
    const table = within(within(canvasElement).getByRole('table'));
    await expect(table.queryByRole('columnheader', { name: 'Situação' })).toBeNull();
    await expect(table.queryByRole('columnheader', { name: /Pago em/ })).toBeNull();
  },
};

export const Paginated: Story = {
  args: { total: 120, page: 2 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('51–57 de 120')).toBeInTheDocument();
    await userEvent.click(canvas.getByText('3'));
    await expect(args.onPageChange).toHaveBeenCalledWith(3);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Empty: Story = {
  args: { items: [], total: 0, emptyDescription: 'Lance receitas, despesas e transferências para acompanhar os saldos.' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Nenhum lançamento neste período')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: { items: [], isLoading: true },
};
