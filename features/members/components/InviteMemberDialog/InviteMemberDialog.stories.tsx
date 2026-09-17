import { InviteMemberDialog } from '@/features/members/components/InviteMemberDialog';
import type { InviteMemberState } from '@/features/members/schemas';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

async function fakeInvite(_state: InviteMemberState, formData: FormData): Promise<InviteMemberState> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const email = String(formData.get('email') ?? '').trim();
  const role = String(formData.get('role') ?? '');
  if (email === 'danilo@exemplo.com') {
    return { status: 'error', message: 'Essa pessoa já faz parte do espaço.', email, role };
  }
  return { status: 'created', email, link: 'https://naency.app/convite/abc123' };
}

const meta: Meta<typeof InviteMemberDialog> = {
  title: 'Features/Members/InviteMemberDialog',
  component: InviteMemberDialog,
  args: { action: fn(fakeInvite) },
};

export default meta;

type Story = StoryObj<typeof InviteMemberDialog>;

export const CreatesLink: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Convidar pessoa' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Convidar pessoa' }));

    await userEvent.type(dialog.getByLabelText('E-mail'), 'ana@exemplo.com');
    await userEvent.click(dialog.getByRole('radio', { name: 'Leitor' }));
    await userEvent.click(dialog.getByRole('button', { name: 'Gerar link de convite' }));

    const created = within(await screen.findByRole('dialog', { name: 'Convite criado' }));
    await expect(created.getByLabelText('Link do convite')).toHaveValue(
      'https://naency.app/convite/abc123',
    );
    const formData = (args.action as ReturnType<typeof fn>).mock.calls[0]?.[1] as FormData;
    await expect(formData.get('role')).toBe('viewer');

    await userEvent.click(created.getByRole('button', { name: 'Concluir' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const AlreadyMember: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Convidar pessoa' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Convidar pessoa' }));
    await userEvent.type(dialog.getByLabelText('E-mail'), 'danilo@exemplo.com');
    await userEvent.click(dialog.getByRole('button', { name: 'Gerar link de convite' }));

    await expect(await dialog.findByRole('alert')).toHaveTextContent('já faz parte');
    await expect(dialog.getByLabelText('E-mail')).toHaveValue('danilo@exemplo.com');

    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};
