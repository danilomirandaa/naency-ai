import { TransactionsList } from '@/features/transactions/components/TransactionsList';
import { transactionsFixture } from '@/features/transactions/fixtures/transactions';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta: Meta<typeof TransactionsList> = {
  title: 'Features/Transactions/TransactionsList',
  component: TransactionsList,
  args: {
    items: transactionsFixture,
    today: '2026-09-17',
    canEdit: true,
    onEdit: fn(),
    onDelete: fn(),
    onStatusChange: fn(async () => {}),
    onCreate: fn(),
    onPageChange: fn(),
    onRetry: fn(),
    page: 1,
    total: transactionsFixture.length,
    pageSize: 50,
  },
  render: (args) => (
    <div className="max-w-3xl">
      <TransactionsList {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof TransactionsList>;

export const Editor: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Terça-feira, 15 de setembro' })).toBeInTheDocument();
    const day15 = within(canvas.getByRole('list', { name: 'Lançamentos de Terça-feira, 15 de setembro' }));
    await expect(day15.getAllByRole('listitem')).toHaveLength(2);
    await expect(day15.getByText('Nubank → Reserva de emergência')).toBeInTheDocument();
    await expect(canvas.getByText('Moradia › Energia · Nubank')).toBeInTheDocument();
    await expect(canvas.getByText('Sem categoria · Carteira')).toBeInTheDocument();
    await expect(canvas.getByText('+R$ 8.500,00')).toBeInTheDocument();
    // Previsto com data passada aparece como atrasado.
    await expect(canvas.getByText('Atrasada')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Marcar Conta de luz como efetivado' }));
    await expect(args.onStatusChange).toHaveBeenCalledWith(transactionsFixture[0], 'cleared');
    await userEvent.click(canvas.getByRole('button', { name: 'Editar Supermercado' }));
    await expect(args.onEdit).toHaveBeenCalledWith(transactionsFixture[1]);
    await userEvent.click(canvas.getByRole('button', { name: 'Excluir Padaria' }));
    await expect(args.onDelete).toHaveBeenCalledWith(transactionsFixture[3]);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Viewer: Story = {
  args: { canEdit: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryAllByRole('button')).toHaveLength(0);
  },
};

export const Paginated: Story = {
  args: { page: 2, total: 120, pageSize: 50 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('51–100 de 120')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Próxima' }));
    await expect(args.onPageChange).toHaveBeenCalledWith(3);
    await userEvent.click(canvas.getByRole('button', { name: 'Anterior' }));
    await expect(args.onPageChange).toHaveBeenCalledWith(1);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const EmptyMonth: Story = {
  args: { items: [], total: 0 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Nenhum lançamento neste mês')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Novo lançamento' }));
    await expect(args.onCreate).toHaveBeenCalledOnce();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const EmptyWithFilters: Story = {
  args: { items: [], total: 0, isFiltered: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Nada encontrado com esses filtros')).toBeInTheDocument();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

export const Loading: Story = {
  args: { items: [], total: 0, isLoading: true },
};

export const LoadError: Story = {
  args: { items: [], total: 0, isError: true },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Tentar de novo' }));
    await expect(args.onRetry).toHaveBeenCalledOnce();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
