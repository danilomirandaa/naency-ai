import { PendingInvitations } from '@/features/members/components/PendingInvitations';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

const now = new Date('2026-09-16T15:00:00Z');

const meta: Meta<typeof PendingInvitations> = {
  title: 'Features/Members/PendingInvitations',
  component: PendingInvitations,
  args: {
    now,
    revokeAction: fn(async () => {}),
    invitations: [
      { id: 'inv-1', email: 'ana@exemplo.com', role: 'editor', expiresAt: new Date('2026-09-23T15:00:00Z') },
      { id: 'inv-2', email: 'carlos@exemplo.com', role: 'viewer', expiresAt: new Date('2026-09-17T15:00:00Z') },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PendingInvitations>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Editor · expira em 7 dias')).toBeVisible();
    await expect(canvas.getByText('Leitor · expira amanhã')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Cancelar convite de carlos@exemplo.com' }));
    await expect(args.revokeAction).toHaveBeenCalledWith('inv-2');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Empty: Story = {
  args: { invitations: [] },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[aria-label="Convites pendentes"]')).toBeNull();
  },
};
