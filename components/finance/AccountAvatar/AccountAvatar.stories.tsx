import { AccountAvatar } from '@/components/finance/AccountAvatar';
import { Text } from '@/components/ui/Text';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from '@/lib/accounts';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof AccountAvatar> = {
  title: 'Finance/AccountAvatar',
  component: AccountAvatar,
};

export default meta;

type Story = StoryObj<typeof AccountAvatar>;

export const WithoutInstitution: Story = {
  render: () => (
    <ul className="flex flex-col gap-3">
      {ACCOUNT_TYPES.map((type) => (
        <li key={type} className="flex items-center gap-2">
          <AccountAvatar type={type} institution={null} />
          <AccountAvatar type={type} institution={null} size="sm" />
          <Text size="sm">{ACCOUNT_TYPE_LABELS[type]}</Text>
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('listitem')).toHaveLength(ACCOUNT_TYPES.length);
  },
};

export const WithInstitution: Story = {
  args: { type: 'checking', institution: { name: 'Nubank', color: '#820AD1' } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('N')).toBeInTheDocument();
  },
};
