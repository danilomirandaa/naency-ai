import { StatCard, trendLabel } from '@/components/finance/StatCard';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof StatCard> = {
  title: 'Finance/StatCard',
  component: StatCard,
  args: { label: 'Receitas', icon: 'income', tone: 'income', cents: 850_000, moneyKind: 'income' },
  decorators: [
    (Story) => (
      <div className="max-w-4xl p-4">
        <StatCard.Group columns={3}>
          <Story />
        </StatCard.Group>
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Receitas')).toBeInTheDocument();
    await expect(canvas.getByText(/R\$.8\.500,00/)).toBeInTheDocument();
  },
};

export const WithTrend: Story = {
  args: { trend: { percent: 13, comparedTo: 'vs. mês anterior', upIs: 'good' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('+13%')).toBeInTheDocument();
    await expect(canvas.getByText('vs. mês anterior')).toBeInTheDocument();
    await expect(trendLabel({ percent: -8 })).toBe('−8%');
    await expect(trendLabel({ percent: 0 })).toBe('igual');
  },
};

export const BadTrend: Story = {
  args: {
    label: 'Despesas',
    icon: 'expense',
    tone: 'expense',
    cents: -612_340,
    moneyKind: 'expense',
    // Gastar mais é má notícia: a mesma subida vem em vermelho.
    trend: { percent: 13, comparedTo: 'vs. mês anterior', upIs: 'bad' },
  },
};

export const AsLink: Story = {
  args: { href: '/transacoes/receitas', detail: '12 lançamentos' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: /Receitas/ })).toHaveAttribute(
      'href',
      '/transacoes/receitas',
    );
  },
};

export const Loading: Story = {
  args: { isLoading: true, trend: { percent: 13, comparedTo: 'vs. mês anterior', upIs: 'good' } },
  play: async ({ canvasElement }) => {
    // Carregando não mostra número nem variação: só o esqueleto.
    await expect(within(canvasElement).queryByText(/R\$/)).toBeNull();
    await expect(within(canvasElement).queryByText('+13%')).toBeNull();
  },
};
