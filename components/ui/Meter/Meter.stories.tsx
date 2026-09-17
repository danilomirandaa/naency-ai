import { Meter } from '@/components/ui/Meter';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof Meter> = {
  title: 'UI/Meter',
  component: Meter,
};

export default meta;

type Story = StoryObj<typeof Meter>;

export const Tones: Story = {
  render: () => (
    <div className="flex max-w-xs flex-col gap-3">
      <Meter label="Uso baixo" value={30} max={100} />
      <Meter label="Uso alto" value={75} max={100} />
      <Meter label="Estourado" value={130} max={100} />
      <Meter label="Meta" value={40} max={100} tone="progress" />
      <Meter label="Sem máximo" value={10} max={0} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('meter', { name: 'Estourado' })).toHaveAttribute('aria-valuenow', '100');
    await expect(canvas.getByRole('meter', { name: 'Uso alto' })).toHaveAttribute('aria-valuetext', '75%');
    await expect(canvas.getByRole('meter', { name: 'Sem máximo' })).toHaveAttribute('aria-valuenow', '100');
  },
};
