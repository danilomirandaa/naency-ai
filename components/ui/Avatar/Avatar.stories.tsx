import { Avatar } from '@/components/ui/Avatar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof Avatar.Root> = {
  title: 'Design System/Avatar',
  component: Avatar.Root,
};

export default meta;

type Story = StoryObj<typeof Avatar.Root>;

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <Avatar.Root key={size} size={size}>
          <Avatar.Fallback>DM</Avatar.Fallback>
        </Avatar.Root>
      ))}
      <Avatar.Root className="rounded-control-sm">
        <Avatar.Fallback className="rounded-control-sm">DM</Avatar.Fallback>
      </Avatar.Root>
    </div>
  ),
};
