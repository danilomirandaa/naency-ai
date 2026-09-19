import type { Icons } from '@/components/ui/Icon';

export type NotificationKind = 'import' | 'import-error' | 'overdue' | 'invoice';

export type NotificationItem = {
  /** Estável entre consultas: serve para marcar como lida. */
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  icon: Icons;
  /** Para onde o clique leva. */
  href: string;
  /** Momento do acontecimento (ISO); ordena a lista e diz o que é novo. */
  at: string;
};
