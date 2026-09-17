import { AuthShell } from '@/components/layout/AuthShell';
import { CreateWorkspaceForm } from '@/features/workspaces/components/CreateWorkspaceForm';
import type { CreateWorkspaceState } from '@/features/workspaces/schemas';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

async function fakeCreate(_state: CreateWorkspaceState, formData: FormData) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const name = String(formData.get('name') ?? '').trim();
  if (name.length < 2) {
    return { status: 'error', message: 'Use pelo menos 2 caracteres.', name } as const;
  }
  return { status: 'idle' } as const;
}

const meta: Meta<typeof CreateWorkspaceForm> = {
  title: 'Features/Workspaces/CreateWorkspaceForm',
  component: CreateWorkspaceForm,
  parameters: { layout: 'fullscreen' },
  args: { action: fn(fakeCreate) },
  decorators: [
    (Story) => (
      <AuthShell>
        <Story />
      </AuthShell>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof CreateWorkspaceForm>;

export const FirstWorkspace: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const name = canvas.getByLabelText('Nome do espaço');
    await userEvent.type(name, 'Finanças da casa');
    await userEvent.click(canvas.getByRole('button', { name: 'Criar espaço' }));
    await expect(args.action).toHaveBeenCalledTimes(1);
    const formData = (args.action as ReturnType<typeof fn>).mock.calls[0]?.[1] as FormData;
    await expect(formData.get('name')).toBe('Finanças da casa');
    await expect(canvas.queryByRole('link', { name: 'Voltar' })).toBeNull();
    await userEvent.clear(name);
  },
};

export const InvalidName: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Nome do espaço'), 'a');
    await userEvent.click(canvas.getByRole('button', { name: 'Criar espaço' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Use pelo menos 2 caracteres.',
    );
    await expect(canvas.getByLabelText('Nome do espaço')).toBeInvalid();
    // O nome digitado continua no campo depois do erro.
    await expect(canvas.getByLabelText('Nome do espaço')).toHaveValue('a');
  },
};

export const AnotherWorkspace: Story = {
  args: { backHref: '/' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: 'Voltar' })).toHaveAttribute(
      'href',
      '/',
    );
  },
};
