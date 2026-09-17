import { AuthShell } from '@/components/layout/AuthShell';
import { AcceptInvitation } from '@/features/members/components/AcceptInvitation';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta: Meta<typeof AcceptInvitation> = {
  title: 'Features/Members/AcceptInvitation',
  component: AcceptInvitation,
  parameters: { layout: 'fullscreen' },
  args: {
    acceptAction: fn(async () => ({ status: 'error', message: 'Este convite já foi usado.' }) as const),
    signOutAction: fn(async () => {}),
  },
  decorators: [
    (Story) => (
      <AuthShell>
        <Story />
      </AuthShell>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof AcceptInvitation>;

export const Valid: Story = {
  args: { view: { status: 'valid', workspaceName: 'Finanças da casa', role: 'editor' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Entrar em Finanças da casa' })).toBeVisible();
    await expect(canvas.getByText(/O convite é para o papel/)).toHaveTextContent('Editor');
  },
};

export const AcceptFails: Story = {
  args: { view: { status: 'valid', workspaceName: 'Finanças da casa', role: 'viewer' } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Aceitar convite' }));
    await expect(args.acceptAction).toHaveBeenCalledTimes(1);
    // Quando o aceite falha (ex.: outra aba usou antes), a mensagem aparece.
    await expect(await canvas.findByRole('alert')).toHaveTextContent('já foi usado');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const EmailMismatch: Story = {
  args: {
    view: {
      status: 'email-mismatch',
      invitedEmail: 'a***@exemplo.com',
      currentEmail: 'danilo@exemplo.com',
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Sair e entrar com outro e-mail' }));
    await expect(args.signOutAction).toHaveBeenCalled();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const AlreadyMember: Story = {
  args: { view: { status: 'already-member', workspaceName: 'Finanças da casa' } },
};

export const Expired: Story = {
  args: { view: { status: 'expired' } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { name: 'Convite expirado' })).toBeVisible();
  },
};

export const Used: Story = {
  args: { view: { status: 'used' } },
};

export const NotFound: Story = {
  args: { view: { status: 'not-found' } },
};
