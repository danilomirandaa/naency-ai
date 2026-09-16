import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/ui/Sidebar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof AppHeader> = {
  title: 'Layout/AppHeader',
  component: AppHeader,
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
