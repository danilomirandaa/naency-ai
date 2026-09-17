import { MembersList } from '@/features/members/components/MembersList';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof MembersList> = {
  title: 'Features/Members/MembersList',
  component: MembersList,
  args: {
    currentUserId: 'danilo',
    members: [
      { userId: 'danilo', name: 'Danilo Miranda', email: 'danilo@exemplo.com', role: 'admin' },
      { userId: 'ana', name: 'Ana Paula', email: 'ana@exemplo.com', role: 'editor' },
      { userId: 'pai', name: 'Carlos', email: 'carlos@exemplo.com', role: 'viewer' },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof MembersList>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const items = within(within(canvasElement).getByRole('list', { name: 'Membros' })).getAllByRole(
      'listitem',
    );
    await expect(items).toHaveLength(3);
    await expect(items[0]).toHaveTextContent('Danilo Miranda (você)');
    await expect(items[0]).toHaveTextContent('Administrador');
    await expect(items[2]).toHaveTextContent('Leitor');
  },
};

export const OnlyMe: Story = {
  args: {
    members: [
      { userId: 'danilo', name: 'Danilo Miranda', email: 'danilo@exemplo.com', role: 'admin' },
    ],
  },
};

export const Manager: Story = {
  args: { canManage: true, onRoleChange: fn(async () => {}), onRemove: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const anaRole = canvas.getByRole('combobox', { name: 'Papel de Ana Paula' });
    await expect(anaRole).toHaveTextContent('Editor');
    await userEvent.click(anaRole);
    await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'Administrador' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await expect(args.onRoleChange).toHaveBeenCalledWith(expect.objectContaining({ userId: 'ana' }), 'admin');

    await userEvent.click(canvas.getByRole('button', { name: 'Remover Carlos' }));
    await expect(args.onRemove).toHaveBeenCalledWith(expect.objectContaining({ userId: 'pai' }));
    await expect(canvas.getByRole('button', { name: 'Sair do espaço' })).toBeInTheDocument();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const MemberCanLeave: Story = {
  args: { currentUserId: 'ana', onRemove: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('combobox')).toBeNull();
    await expect(canvas.queryByRole('button', { name: /Remover/ })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Sair do espaço' })).toBeInTheDocument();
  },
};
