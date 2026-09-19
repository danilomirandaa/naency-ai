import { NotificationsBell, timeAgo, unreadCount } from '@/features/notifications/components/NotificationsBell';
import type { NotificationItem } from '@/features/notifications/types';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const items: NotificationItem[] = [
  {
    id: 'import-1',
    kind: 'import',
    title: 'Importação concluída',
    description: 'Fatura2026-10-05.csv entrou em XP Black.',
    icon: 'upload',
    href: '/transacoes',
    at: '2026-09-18T20:40:00.000Z',
  },
  {
    id: 'overdue-1',
    kind: 'overdue',
    title: '3 contas atrasadas',
    description: 'A mais antiga venceu em 05/09/2026.',
    icon: 'alert-circle',
    href: '/transacoes?situacao=atrasadas',
    at: '2026-09-18T03:00:00.000Z',
  },
  {
    id: 'invoice-1',
    kind: 'invoice',
    title: 'Fatura de outubro fechada',
    description: 'XP Black: vence em 05/10/2026.',
    icon: 'credit-card',
    href: '/cartoes/xp?fatura=2026-10',
    at: '2026-09-16T00:00:00.000Z',
  },
];

const meta: Meta<typeof NotificationsBell> = {
  title: 'Features/Notifications/NotificationsBell',
  component: NotificationsBell,
  args: { items, lastSeenAt: '2026-09-18T12:00:00.000Z', onOpen: fn() },
  decorators: [
    (Story) => (
      <div className="flex justify-end p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof NotificationsBell>;

export const WithUnread: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // Só o aviso posterior à última abertura conta como novo.
    const bell = canvas.getByRole('button', { name: 'Notificações (1 novas)' });
    await userEvent.click(bell);
    const list = within(await screen.findByRole('list', { name: 'Notificações' }));
    await expect(list.getAllByRole('listitem')).toHaveLength(3);
    await expect(list.getByText('Importação concluída')).toBeInTheDocument();
    await expect(list.getByRole('link', { name: /3 contas atrasadas/ })).toHaveAttribute(
      'href',
      '/transacoes?situacao=atrasadas',
    );
    await expect(args.onOpen).toHaveBeenCalledOnce();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('list', { name: 'Notificações' })).toBeNull());
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Notificações' }));
    await expect(await screen.findByText('Nenhuma notificação')).toBeInTheDocument();
    await expect(screen.getByText('Você não tem notificações pendentes')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Nenhuma notificação')).toBeNull());
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const NeverOpened: Story = {
  args: { lastSeenAt: null },
  play: async ({ canvasElement }) => {
    // Sem abertura anterior, tudo é novo.
    await expect(within(canvasElement).getByRole('button', { name: 'Notificações (3 novas)' })).toBeInTheDocument();
    await expect(unreadCount(items, '2026-09-18T21:00:00.000Z')).toBe(0);
    const now = new Date('2026-09-18T21:00:00.000Z');
    await expect(timeAgo('2026-09-18T20:40:00.000Z', now)).toBe('há 20 min');
    await expect(timeAgo('2026-09-18T03:00:00.000Z', now)).toBe('há 18 h');
    await expect(timeAgo('2026-09-16T00:00:00.000Z', now)).toBe('há 3 dias');
    await expect(timeAgo('2026-09-18T20:59:50.000Z', now)).toBe('agora');
  },
};
