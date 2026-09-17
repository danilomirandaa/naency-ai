import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/ui/Sidebar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof AppHeader> = {
  title: 'Layout/AppHeader',
  component: AppHeader,
  args: { today: '2026-09-16', periodCookie: null },
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true, navigation: { pathname: '/transacoes/receitas' } },
  },
  decorators: [
    (Story) => (
      <Sidebar.Provider className="min-h-0">
        <div className="w-full">
          <Story />
        </div>
      </Sidebar.Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof AppHeader>;

export const NestedRoute: Story = {
  play: async ({ canvasElement }) => {
    const breadcrumb = within(
      within(canvasElement).getByRole('navigation', { name: 'breadcrumb' }),
    );
    await expect(breadcrumb.getByRole('link', { name: 'Transações' })).toHaveAttribute(
      'href',
      '/transacoes',
    );
    await expect(breadcrumb.getByText('Receitas')).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

export const TopLevelRoute: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/' } },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Visão geral')).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

export const PeriodFromUrl: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/transacoes', query: { de: '2026-09-13', ate: '2026-09-19' } },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const period = within(canvas.getByRole('group', { name: 'Período' }));
    // Intervalo da URL: atalho "Esta semana" ativo.
    await expect(period.getByRole('button', { name: 'Esta semana' })).toBeInTheDocument();
    await userEvent.click(period.getByRole('button', { name: 'Esta semana' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Este ano' }));
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await expect(document.cookie).toContain('naency_periodo=2026-01-01_2026-12-31');
    document.cookie = 'naency_periodo=; path=/; max-age=0';
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const PeriodFromCookie: Story = {
  args: { periodCookie: '2026-08-01_2026-08-31' },
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: '/relatorios' } } },
  play: async ({ canvasElement }) => {
    const period = within(within(canvasElement).getByRole('group', { name: 'Período' }));
    await expect(period.getByText('Agosto de 2026')).toBeInTheDocument();
    // Mês inteiro é navegação de mês, não filtro.
    await expect(period.getByRole('button', { name: 'Filtre por' })).toBeInTheDocument();
  },
};

export const NoPeriodOnAccounts: Story = {
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: '/contas' } } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('group', { name: 'Período' })).toBeNull();
  },
};
