import { AccountsList } from '@/features/accounts/components/AccountsList';
import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta: Meta<typeof AccountsList> = {
  title: 'Features/Accounts/AccountsList',
  component: AccountsList,
  args: {
    accounts: accountsFixture,
    canEdit: true,
    onCreate: fn(),
    onEdit: fn(),
    onArchiveChange: fn(async () => {}),
    onRetry: fn(),
  },
  render: (args) => (
    <div className="flex max-w-2xl flex-col gap-4">
      <AccountsList {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof AccountsList>;

export const Editor: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const active = within(canvas.getByRole('list', { name: 'Contas ativas' }));
    await expect(active.getAllByRole('listitem')).toHaveLength(3);
    // Total só das ativas: 4.321,90 + 25.000,00 − 15,50.
    await expect(canvas.getByText('R$ 29.306,40')).toBeInTheDocument();
    await expect(active.getByText('Investimentos · XP Investimentos')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Editar Carteira' }));
    await expect(args.onEdit).toHaveBeenCalledWith(accountsFixture[2]);

    await userEvent.click(canvas.getByRole('button', { name: 'Arquivar Nubank' }));
    await expect(args.onArchiveChange).toHaveBeenCalledWith(accountsFixture[0], true);

    const archived = within(canvas.getByRole('list', { name: 'Contas arquivadas' }));
    await expect(archived.queryByRole('button', { name: /Editar/ })).toBeNull();
    await userEvent.click(archived.getByRole('button', { name: 'Desarquivar Conta antiga' }));
    await expect(args.onArchiveChange).toHaveBeenLastCalledWith(accountsFixture[3], false);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Viewer: Story = {
  args: { canEdit: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(4);
    await expect(canvas.queryAllByRole('button')).toHaveLength(0);
  },
};

export const EmptyEditor: Story = {
  args: { accounts: [] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Nenhuma conta ativa')).toBeInTheDocument();
    await expect(canvas.queryByRole('list', { name: 'Contas arquivadas' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Nova conta' }));
    await expect(args.onCreate).toHaveBeenCalledOnce();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const EmptyViewer: Story = {
  args: { accounts: [], canEdit: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText('Quem edita este espaço ainda não cadastrou contas.'),
    ).toBeInTheDocument();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

export const OnlyArchived: Story = {
  args: { accounts: accountsFixture.filter((account) => account.archived) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Nenhuma conta ativa')).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'Contas arquivadas' })).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: { accounts: [], isLoading: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('list')).toBeNull();
  },
};

export const LoadError: Story = {
  args: { accounts: [], isError: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Não foi possível carregar as contas')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Tentar de novo' }));
    await expect(args.onRetry).toHaveBeenCalledOnce();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
