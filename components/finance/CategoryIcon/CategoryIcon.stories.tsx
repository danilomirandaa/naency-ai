import { CategoryIcon } from '@/components/finance/CategoryIcon';
import { Text } from '@/components/ui/Text';
import { DEFAULT_CATEGORIES } from '@/lib/categories';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof CategoryIcon> = {
  title: 'Finance/CategoryIcon',
  component: CategoryIcon,
};

export default meta;

type Story = StoryObj<typeof CategoryIcon>;

export const Defaults: Story = {
  render: () => (
    <ul className="grid max-w-lg grid-cols-2 gap-3">
      {DEFAULT_CATEGORIES.map((category) => (
        <li key={`${category.kind}-${category.name}`} className="flex items-center gap-2">
          <CategoryIcon icon={category.icon} color={category.color} />
          <CategoryIcon icon={category.icon} color={category.color} size="sm" />
          <Text size="sm">{category.name}</Text>
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('listitem')).toHaveLength(DEFAULT_CATEGORIES.length);
  },
};
