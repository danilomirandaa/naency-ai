import { MemberAvatar } from '@/components/finance/MemberAvatar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof MemberAvatar> = {
  title: 'Finance/MemberAvatar',
  component: MemberAvatar,
};

export default meta;

type Story = StoryObj<typeof MemberAvatar>;

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <MemberAvatar name="Danilo Miranda" size="sm" />
      <MemberAvatar name="Danilo Miranda" />
      <MemberAvatar name="Ana Paula" size="lg" />
      <MemberAvatar name="Danilo Miranda" shape="square" />
    </div>
  ),
};
