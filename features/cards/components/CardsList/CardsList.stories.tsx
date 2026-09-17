import { CardsList } from '@/features/cards/components/CardsList';
import { cardsFixture } from '@/features/cards/fixtures/cards';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof CardsList> = {
  title: 'Features/Cards/CardsList',
  component: CardsList,
  args: { cards: cardsFixture, canEdit: true, newCardHref: '/contas?nova=cartao' },
  render: (args) => (
    <div className="max-w-3xl">
      <CardsList {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof CardsList>;

export const WithCards: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nubank = canvas.getByRole('link', { name: /Nubank Roxinho/ });
    await expect(nubank).toHaveAttribute('href', '/cartoes/0000000c-0000-4000-8000-000000000001');
    await expect(within(nubank).getByText('Fatura de outubro de 2026')).toBeInTheDocument();
    await expect(within(nubank).getByText('R$ 2.384,50')).toBeInTheDocument();
    await expect(within(nubank).getByText('Vence 05/10/2026')).toBeInTheDocument();
    // Sem limite cadastrado, sem barra.
    await expect(within(canvas.getByRole('link', { name: /Inter Gold/ })).queryByRole('meter')).toBeNull();
  },
};

export const Empty: Story = {
  args: { cards: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: 'Novo cartão' })).toHaveAttribute(
      'href',
      '/contas?nova=cartao',
    );
  },
};

export const EmptyViewer: Story = {
  args: { cards: [], canEdit: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('link')).toBeNull();
  },
};

export const Loading: Story = {
  args: { cards: [], isLoading: true },
};
