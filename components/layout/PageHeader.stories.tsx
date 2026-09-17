import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof PageHeader> = {
  title: 'Layout/PageHeader',
  component: PageHeader,
};

export default meta;

type Story = StoryObj<typeof PageHeader>;

export const WithActions: Story = {
  args: {
    title: 'Membros',
    description: 'Quem tem acesso a Finanças da casa.',
    actions: (
      <Button size="large" icon={<Icon icon="add" />}>
        Convidar pessoa
      </Button>
    ),
  },
};

export const TitleOnly: Story = {
  args: { title: 'Visão geral' },
};
