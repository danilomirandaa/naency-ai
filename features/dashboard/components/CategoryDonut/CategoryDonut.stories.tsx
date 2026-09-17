import { CategoryDonut } from '@/features/dashboard/components/CategoryDonut';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';

const meta: Meta<typeof CategoryDonut> = {
  title: 'Features/Dashboard/CategoryDonut',
  component: CategoryDonut,
  args: {
    slices: [
      { name: 'Moradia', color: '#6366F1', valueCents: 238_990 },
      { name: 'Mercado', color: '#16A34A', valueCents: 132_450 },
      { name: 'Alimentação', color: '#EA580C', valueCents: 64_300 },
      { name: 'Bem-estar e estética', color: '#0D9488', valueCents: 41_200 },
      { name: 'Sem categoria', color: null, valueCents: 46_610 },
      { name: 'Vazia', color: '#DB2777', valueCents: 0 },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof CategoryDonut>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const donut = canvasElement.querySelector('[data-testid="category-donut"]') as HTMLElement;
    await expect(donut).toHaveAttribute('aria-hidden', 'true');
    await expect(donut).toHaveTextContent('R$ 5.235,50');
    // Fatia zerada não entra; nomes com espaço e acento não quebram o gradiente.
    await waitFor(() => expect(donut.querySelectorAll('.recharts-pie-sector')).toHaveLength(5));
    // A animação de entrada termina com o anel inteiro desenhado (176px de diâmetro).
    await waitFor(
      () => {
        const ring = donut.querySelector('.recharts-pie')!.getBoundingClientRect();
        expect(Math.round(ring.width)).toBeGreaterThan(160);
        expect(Math.round(ring.height)).toBeGreaterThan(160);
      },
      { timeout: 4000 },
    );
    const fills = [...donut.querySelectorAll('.recharts-pie-sector path')].map((path) => path.getAttribute('fill'));
    await expect(fills.every((fill) => /^url\(#[\w-]+-colors-slice\d\)$/.test(fill ?? ''))).toBe(true);
  },
};

export const SingleCategory: Story = {
  args: { slices: [{ name: 'Moradia', color: '#6366F1', valueCents: 100_000 }] },
};
