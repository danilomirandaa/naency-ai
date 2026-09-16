import { Button } from '@/components/ui/Button';
import { DeleteDialog } from '@/components/ui/DeleteDialog';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import type { ComponentProps } from 'react';
import { useState } from 'react';

const meta: Meta<typeof DeleteDialog> = {
  title: 'Design System/DeleteDialog',
  component: DeleteDialog,
};

export default meta;

type Story = StoryObj<typeof DeleteDialog>;

function DeleteDialogDemo(
  args: Omit<ComponentProps<typeof DeleteDialog>, 'open' | 'onClose' | 'onConfirm'>,
) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Excluir transação
      </Button>
      <DeleteDialog
        {...args}
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={async () => {
          await new Promise((resolve) => setTimeout(resolve, 800));
          setOpen(false);
        }}
      />
    </>
  );
}

export const Default: Story = {
  render: (args) => <DeleteDialogDemo {...args} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Excluir transação' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Excluir transação',
    });
    const confirm = within(dialog).getByRole('button', { name: 'Excluir' });
    await userEvent.click(confirm);
    // Enquanto a exclusão roda, os botões ficam bloqueados.
    await expect(confirm).toBeDisabled();
    await expect(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    ).toBeDisabled();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), {
      timeout: 3000,
    });
  },
  args: {
    title: 'Excluir transação',
    subtitle: 'Tem certeza que deseja excluir "Mercado — R$ 342,90"?',
    warnText: 'Essa ação não pode ser desfeita.',
    deleteButtonText: 'Excluir',
  },
};
