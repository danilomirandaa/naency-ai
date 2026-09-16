import { Breadcrumb } from '@/components/ui/Breadcrumb';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof Breadcrumb.Root> = {
  title: 'Design System/Breadcrumb',
  component: Breadcrumb.Root,
};

export default meta;

type Story = StoryObj<typeof Breadcrumb.Root>;

export const Default: Story = {
  render: () => (
    <Breadcrumb.Root>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="#">Transações</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Link href="#">Despesas</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Page>Setembro 2026</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  ),
};
