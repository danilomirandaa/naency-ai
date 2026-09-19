'use client';

import { notificationsQuery } from '@/features/notifications/api/notifications.queries';
import { NotificationsBell } from '@/features/notifications/components/NotificationsBell';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

const STORAGE_KEY = 'naency-notificacoes-vistas';

/**
 * A última abertura vive no `localStorage`, que é externo ao React: por isso
 * `useSyncExternalStore` em vez de estado + efeito. No servidor o valor é sempre
 * `null` (tudo conta como novo) e a hidratação não briga.
 */
const listeners = new Set<() => void>();
/** Usado quando o navegador não deixa gravar (janela anônima). */
let fallback: string | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getLastSeenAt() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? fallback;
  } catch {
    return fallback;
  }
}

function markSeen() {
  fallback = new Date().toISOString();
  try {
    window.localStorage.setItem(STORAGE_KEY, fallback);
  } catch {
    // Sem storage: vale só enquanto a aba estiver aberta.
  }
  for (const listener of listeners) {
    listener();
  }
}

/** Container: busca os avisos e guarda no navegador quando você abriu pela última vez. */
export function NotificationsMenu({ workspaceId }: { workspaceId: string }) {
  const { data, isPending } = useQuery(notificationsQuery.options(workspaceId));
  const lastSeenAt = React.useSyncExternalStore(subscribe, getLastSeenAt, () => null);

  return <NotificationsBell items={data ?? []} isLoading={isPending} lastSeenAt={lastSeenAt} onOpen={markSeen} />;
}
