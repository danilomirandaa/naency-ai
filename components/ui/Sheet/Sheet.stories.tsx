import { Button } from '@/components/ui/Button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof SheetContent> = {
  title: 'Design System/Sheet',
  component: SheetContent,
  argTypes: {
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
  },
  args: { side: 'right' },
};

export default meta;

type Story = StoryObj<typeof SheetContent>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Filtros' }),
    );
    await expect(
      await screen.findByRole('dialog', { name: 'Filtros' }),
    ).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
  render: (args) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Filtros</Button>
      </SheetTrigger>
      <SheetContent {...args}>
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Refine as transações exibidas.</SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <Text size="sm" color="secondary">
            Conteúdo do painel lateral.
          </Text>
        </div>
        <SheetFooter>
          <Button>Aplicar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};
