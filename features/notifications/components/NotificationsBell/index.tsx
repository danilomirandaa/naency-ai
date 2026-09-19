'use client';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Text } from '@/components/ui/Text';
import type { NotificationItem } from '@/features/notifications/types';
import { classMerge } from '@/lib/utils';
import Link from 'next/link';
import * as React from 'react';

export type NotificationsBellProps = {
  items: NotificationItem[];
  /** Momento da última abertura (ISO); o que é mais novo conta como não lido. */
  lastSeenAt: string | null;
  onOpen?: () => void;
  isLoading?: boolean;
};

/** "há 5 minutos", "ontem": tempo curto, sem biblioteca. */
export function timeAgo(at: string, now: Date = new Date()) {
  const minutes = Math.max(0, Math.round((now.getTime() - Date.parse(at)) / 60_000));
  if (minutes < 1) {
    return 'agora';
  }
  if (minutes < 60) {
    return `há ${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `há ${hours} h`;
  }
  const days = Math.round(hours / 24);
  return days === 1 ? 'ontem' : `há ${days} dias`;
}

export function unreadCount(items: NotificationItem[], lastSeenAt: string | null) {
  return lastSeenAt ? items.filter((item) => item.at > lastSeenAt).length : items.length;
}

/** Sino do header: o que aconteceu no espaço, com o que é novo em destaque. */
export function NotificationsBell({ items, lastSeenAt, onOpen, isLoading = false }: NotificationsBellProps) {
  const [open, setOpen] = React.useState(false);
  const unread = unreadCount(items, lastSeenAt);

  return (
    <Popover
      open={open}
      onOpenChange={(next: boolean) => {
        setOpen(next);
        if (next) {
          onOpen?.();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={unread > 0 ? `Notificações (${unread} novas)` : 'Notificações'}>
          <span className="relative flex">
            <Icon icon="bell" />
            {unread > 0 && (
              <span
                aria-hidden
                className="-right-1 -top-1 absolute flex min-w-4 items-center justify-center rounded-full bg-background-status-critical-rest px-1 font-medium text-[10px] text-typography-neutral-on-color leading-4"
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="border-border-neutral-subtle border-b px-4 py-3">
          <Text size="sm" weight="medium">
            Notificações
          </Text>
        </div>
        {items.length === 0 ? (
          <Panel.EmptyState
            icon="bell"
            title={isLoading ? 'Carregando…' : 'Nenhuma notificação'}
            description={isLoading ? undefined : 'Você não tem notificações pendentes'}
            className="py-8"
          />
        ) : (
          <ul aria-label="Notificações" className="flex max-h-96 flex-col overflow-y-auto">
            {items.map((item) => {
              const isNew = !lastSeenAt || item.at > lastSeenAt;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={classMerge(
                      'flex items-start gap-3 border-border-neutral-subtle border-b px-4 py-3 outline-hidden transition-colors last:border-b-0 hover:bg-background-neutral-100 focus-visible:bg-background-neutral-100',
                      isNew && 'bg-background-neutral-100/60',
                    )}
                  >
                    <Icon
                      icon={item.icon}
                      className={classMerge(
                        'mt-0.5 size-4 shrink-0',
                        item.kind === 'import-error' || item.kind === 'overdue'
                          ? 'text-icon-status-critical-rest'
                          : 'text-icon-neutral-rest',
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <Text size="sm" weight={isNew ? 'medium' : 'normal'} className="truncate">
                        {item.title}
                      </Text>
                      <Text size="xs" color="secondary">
                        {item.description}
                      </Text>
                      <Text size="xs" color="secondary">
                        {timeAgo(item.at)}
                      </Text>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
