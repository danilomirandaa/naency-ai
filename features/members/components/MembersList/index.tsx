'use client';

import { MemberAvatar } from '@/components/finance/MemberAvatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { List } from '@/components/ui/List';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';
import { ROLE_LABELS, WORKSPACE_ROLES, type WorkspaceRole } from '@/lib/permissions';
import { useTransition } from 'react';

export type MembersListItem = {
  userId: string;
  name: string;
  email: string | null;
  role: WorkspaceRole;
};

const roleBadgeColor: Record<WorkspaceRole, 'dark' | 'blue' | 'gray'> = {
  admin: 'dark',
  editor: 'blue',
  viewer: 'gray',
};

export type MembersListProps = {
  members: MembersListItem[];
  currentUserId: string;
  /** Admin: troca papéis e remove pessoas. */
  canManage?: boolean;
  onRoleChange?: (member: MembersListItem, role: WorkspaceRole) => Promise<void>;
  /** Remover alguém ou, para a própria pessoa, sair do espaço. */
  onRemove?: (member: MembersListItem) => void;
};

function RoleSelect({
  member,
  onRoleChange,
}: {
  member: MembersListItem;
  onRoleChange: NonNullable<MembersListProps['onRoleChange']>;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <Select.Root
      value={member.role}
      disabled={isPending}
      onValueChange={(role) => startTransition(() => onRoleChange(member, role as WorkspaceRole))}
    >
      <Select.Trigger aria-label={`Papel de ${member.name}`} className="h-8 w-36">
        <Select.Value />
      </Select.Trigger>
      <Select.Content align="end">
        {WORKSPACE_ROLES.map((role) => (
          <Select.Item key={role} value={role}>
            {ROLE_LABELS[role]}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

/** Pessoas com acesso ao espaço e o papel de cada uma. */
export function MembersList({
  members,
  currentUserId,
  canManage = false,
  onRoleChange,
  onRemove,
}: MembersListProps) {
  return (
    <Panel.Root>
      <Panel.Header>
        <Panel.HeaderText>
          <Panel.Title>Pessoas no espaço</Panel.Title>
          <Panel.Description>
            {members.length === 1 ? '1 pessoa' : `${members.length} pessoas`}
          </Panel.Description>
        </Panel.HeaderText>
      </Panel.Header>
      <Panel.Body>
        <List.Root aria-label="Membros">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            return (
              <List.Item key={member.userId}>
                <MemberAvatar name={member.name} />
                <List.ItemText>
                  <Text size="sm" weight="medium" className="truncate">
                    {member.name}
                    {isSelf && (
                      <Text size="sm" color="secondary">
                        {' '}
                        (você)
                      </Text>
                    )}
                  </Text>
                  {member.email && (
                    <Text size="xs" color="secondary" className="truncate">
                      {member.email}
                    </Text>
                  )}
                </List.ItemText>
                {canManage && onRoleChange ? (
                  <RoleSelect member={member} onRoleChange={onRoleChange} />
                ) : (
                  <Panel.RowBadge color={roleBadgeColor[member.role]}>
                    {ROLE_LABELS[member.role]}
                  </Panel.RowBadge>
                )}
                {onRemove && (canManage || isSelf) && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={isSelf ? 'Sair do espaço' : `Remover ${member.name}`}
                    onClick={() => onRemove(member)}
                  >
                    <Icon icon={isSelf ? 'logout' : 'delete'} />
                  </Button>
                )}
              </List.Item>
            );
          })}
        </List.Root>
      </Panel.Body>
    </Panel.Root>
  );
}
