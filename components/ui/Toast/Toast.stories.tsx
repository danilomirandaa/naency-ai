import { Button } from '@/components/ui/Button';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

function Demo() {
  const toast = useToast();
  return (
    <div className="flex gap-2">
      <Button onClick={() => toast({ title: 'Importação concluída', description: '68 lançamentos criados.', variant: 'success' })}>
        Concluído
      </Button>
      <Button
        variant="outline"
        onClick={() => toast({ title: 'A AI não respondeu', description: 'Tente de novo em instantes.', variant: 'critical' })}
      >
        Erro
      </Button>
    </div>
  );
}

const meta: Meta = {
  title: 'Design System/Toast',
  render: () => (
    <ToastProvider>
      <Demo />
    </ToastProvider>
  ),
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Concluído' }));
    const success = within((await screen.findByText('Importação concluída')).closest('li') as HTMLElement);
    await expect(success.getByText('68 lançamentos criados.')).toBeInTheDocument();

    // Vários avisos convivem; cada um fecha no próprio botão.
    await userEvent.click(canvas.getByRole('button', { name: 'Erro' }));
    await expect(await screen.findByText('A AI não respondeu')).toBeInTheDocument();
    await userEvent.click(success.getByRole('button', { name: 'Fechar aviso' }));
    await waitFor(() => expect(screen.queryByText('Importação concluída')).toBeNull());
    await expect(screen.getByText('A AI não respondeu')).toBeInTheDocument();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Persistent: Story = {
  render: () => (
    <ToastProvider duration={Number.POSITIVE_INFINITY}>
      <Demo />
    </ToastProvider>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Erro' }));
    await expect(await screen.findByText('A AI não respondeu')).toBeInTheDocument();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
