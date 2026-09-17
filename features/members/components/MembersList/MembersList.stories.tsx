import { MembersList } from '@/features/members/components/MembersList';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof MembersList> = {
  title: 'Features/Members/MembersList',
  component: MembersList,
  args: {
    currentUserId: 'danilo',
    members: [
      { userId: 'danilo', name: 'Danilo Miranda', email: 'danilo@exemplo.com', role: 'admin' },
      { userId: 'ana', name: 'Ana Paula', email: 'ana@exemplo.com', role: 'editor' },
      { userId: 'pai', name: 'Carlos', email: 'carlos@exemplo.com', role: 'viewer' },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof MembersList>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const items = within(within(canvasElement).getByRole('list', { name: 'Membros' })).getAllByRole(
      'listitem',
    );
    await expect(items).toHaveLength(3);
    await expect(items[0]).toHaveTextContent('Danilo Miranda (você)');
    await expect(items[0]).toHaveTextContent('Administrador');
    await expect(items[2]).toHaveTextContent('Leitor');
  },
};

export const OnlyMe: Story = {
  args: {
    members: [
      { userId: 'danilo', name: 'Danilo Miranda', email: 'danilo@exemplo.com', role: 'admin' },
    ],
  },
};
