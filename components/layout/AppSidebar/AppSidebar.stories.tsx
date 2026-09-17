import { AppSidebar } from '@/components/layout/AppSidebar';
import { Sidebar } from '@/components/ui/Sidebar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta: Meta<typeof AppSidebar> = {
  title: 'Layout/AppSidebar',
  component: AppSidebar,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true, navigation: { pathname: '/transacoes/receitas' } },
  },
  args: {
    user: { name: 'Danilo Miranda', description: 'Conta pessoal' },
    signOutAction: fn(async () => {}),
    workspaces: [
      { id: 'casa', name: 'Finanças da casa', role: 'admin' },
      { id: 'praia', name: 'Casa da praia', role: 'viewer' },
    ],
    activeWorkspaceId: 'casa',
    selectWorkspaceAction: fn(async () => {}),
  },
  decorators: [
    (Story) => (
      <Sidebar.Provider>
        <Story />
        <Sidebar.Inset>
          <div className="min-h-svh" />
        </Sidebar.Inset>
      </Sidebar.Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof AppSidebar>;

export const ActiveSubItem: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A rota /transacoes/receitas marca o item pai e o subitem como ativos.
    await expect(canvas.getByRole('link', { name: 'Transações' })).toHaveAttribute(
      'data-active',
      'true',
    );
    await expect(canvas.getByRole('link', { name: 'Receitas' })).toHaveAttribute(
      'data-active',
      'true',
    );

    // Grupos fechados expandem pelo botão de ação.
    await expect(canvas.queryByRole('link', { name: 'Orçamentos' })).toBeNull();
    const expandPlanning = canvas.getByRole('button', {
      name: 'Expandir Planejamento',
    });
    await userEvent.click(expandPlanning);
    await expect(canvas.getByRole('link', { name: 'Orçamentos' })).toBeVisible();
    await userEvent.click(expandPlanning);
    // Sem foco residual: o anel de foco nem sempre aparece após clique simulado,
    // o que deixava o screenshot instável.
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Overview: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/' } },
  },
};
