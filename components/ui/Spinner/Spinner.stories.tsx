import { Spinner } from '@/components/ui/Spinner';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
};

export default meta;

type Story = StoryObj<typeof Spinner>;

export const Announced: Story = {
  args: { className: '[animation-play-state:paused]' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
  },
};

export const Decorative: Story = {
  args: { label: null, className: '[animation-play-state:paused]' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('status')).toBeNull();
  },
};
