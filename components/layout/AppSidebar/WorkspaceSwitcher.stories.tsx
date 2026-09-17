import { WorkspaceSwitcher } from '@/components/layout/AppSidebar/WorkspaceSwitcher';
import { Sidebar } from '@/components/ui/Sidebar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof WorkspaceSwitcher> = {
  title: 'Layout/WorkspaceSwitcher',
  component: WorkspaceSwitcher,
  parameters: { nextjs: { appDirectory: true } },
  args: {
    workspaces: [
      { id: 'casa', name: 'Finanças da casa', role: 'admin' },
      { id: 'praia', name: 'Casa da praia', role: 'viewer' },
    ],
    activeWorkspaceId: 'casa',
    selectWorkspaceAction: fn(async () => {}),
    newWorkspaceHref: '/comecar?novo=1',
  },
  decorators: [
    (Story) => (
      <Sidebar.Provider className="min-h-0">
        <div className="w-64 rounded-control bg-background-surface-sunken p-2">
          <Story />
        </div>
      </Sidebar.Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof WorkspaceSwitcher>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Espaço atual: Finanças da casa. Trocar espaço',
    });
    await expect(trigger).toHaveTextContent('Administrador');

    await userEvent.click(trigger);
    const menu = within(await screen.findByRole('menu'));
    await expect(menu.getByRole('menuitem', { name: /Novo espaço/ })).toHaveAttribute(
      'href',
      '/comecar?novo=1',
    );

    await userEvent.click(menu.getByRole('menuitem', { name: /Casa da praia/ }));
    await expect(args.selectWorkspaceAction).toHaveBeenCalledWith('praia');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const SelectingCurrentDoesNothing: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Trocar espaço/ }));
    const menu = within(await screen.findByRole('menu'));
    await userEvent.click(menu.getByRole('menuitem', { name: /Finanças da casa/ }));
    await expect(args.selectWorkspaceAction).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
