'use client';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { formatRelativeDays } from '@/lib/dates';
import { ROLE_LABELS, type WorkspaceRole } from '@/lib/permissions';
import { useTransition } from 'react';

export type PendingInvitationItem = {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: Date;
};

export type PendingInvitationsProps = {
  invitations: PendingInvitationItem[];
  revokeAction: (invitationId: string) => Promise<void>;
  /** Momento de referência para "expira em X dias" (fixo nas stories). */
  now: Date;
};

function RevokeButton({
  email,
  onRevoke,
}: {
  email: string;
  onRevoke: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="standalone"
      colors="standalone-critical"
      size="medium"
      isLoading={isPending}
      aria-label={`Cancelar convite de ${email}`}
      onClick={() => startTransition(onRevoke)}
    >
      Cancelar
    </Button>
  );
}

/** Convites ainda não aceitos. Não renderiza nada quando não há convites. */
export function PendingInvitations({ invitations, revokeAction, now }: PendingInvitationsProps) {
  if (invitations.length === 0) {
    return null;
  }

  return (
    <Panel.Root>
      <Panel.Header>
        <Panel.HeaderText>
          <Panel.Title>Convites pendentes</Panel.Title>
          <Panel.Description>Links enviados que ainda não foram aceitos.</Panel.Description>
        </Panel.HeaderText>
      </Panel.Header>
      <Panel.Body>
        <ul aria-label="Convites pendentes" className="flex flex-col">
          {invitations.map((invitation) => (
            <li
              key={invitation.id}
              className="flex items-center gap-3 border-border-neutral-subtle border-b px-4 py-3 last:border-b-0"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background-neutral-100">
                <Icon icon="mail" className="size-4 text-icon-neutral-rest" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <Text size="sm" weight="medium" className="truncate">
                  {invitation.email}
                </Text>
                <Text size="xs" color="secondary">
                  {ROLE_LABELS[invitation.role]} · expira {formatRelativeDays(invitation.expiresAt, now)}
                </Text>
              </div>
              <RevokeButton
                email={invitation.email}
                onRevoke={() => revokeAction(invitation.id)}
              />
            </li>
          ))}
        </ul>
      </Panel.Body>
    </Panel.Root>
  );
}
