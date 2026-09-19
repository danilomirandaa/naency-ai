import type { NotificationItem } from '@/features/notifications/types';
import { fetchJson } from '@/lib/api/fetch-json';
import { queryOptions } from '@tanstack/react-query';

/** Contrato de query dos avisos (docs/architecture.md). */
export const notificationsQuery = {
  all: (workspaceId: string) => ['workspace', workspaceId, 'notifications'] as const,
  options: (workspaceId: string) =>
    queryOptions({
      queryKey: notificationsQuery.all(workspaceId),
      queryFn: () => fetchJson<NotificationItem[]>(`/api/workspaces/${workspaceId}/notifications`),
    }),
};
