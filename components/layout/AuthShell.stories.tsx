import { AuthShell } from '@/components/layout/AuthShell';
import { Text } from '@/components/ui/Text';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof AuthShell> = {
  title: 'Layout/AuthShell',
  component: AuthShell,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof AuthShell>;

export const Default: Story = {
  args: {
    children: (
      <Text element="h1" size="3xl" weight="semibold">
        Conteúdo da tela
      </Text>
    ),
  },
};
