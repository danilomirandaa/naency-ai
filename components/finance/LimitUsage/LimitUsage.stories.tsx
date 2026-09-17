import { LimitUsage } from '@/components/finance/LimitUsage';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof LimitUsage> = {
  title: 'Finance/LimitUsage',
  component: LimitUsage,
  render: (args) => (
    <div className="max-w-xs">
      <LimitUsage {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof LimitUsage>;

export const Healthy: Story = {
  args: { limitCents: 800_000, usedCents: 284_440 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('meter', { name: 'Limite usado' })).toHaveAttribute('aria-valuenow', '36');
    await expect(canvas.getByText('R$ 5.155,60')).toBeInTheDocument();
  },
};

export const AlmostFull: Story = {
  args: { limitCents: 500_000, usedCents: 470_000 },
};

export const OverLimit: Story = {
  args: { limitCents: 100_000, usedCents: 120_000 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('meter')).toHaveAttribute('aria-valuenow', '100');
    await expect(canvas.getByText('-R$ 200,00')).toBeInTheDocument();
  },
};
