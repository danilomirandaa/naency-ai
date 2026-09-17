import { MemberAvatar } from '@/components/finance/MemberAvatar';
import { List } from '@/components/ui/List';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { ROLE_LABELS, type WorkspaceRole } from '@/lib/permissions';

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
};

/** Pessoas com acesso ao espaço e o papel de cada uma. */
export function MembersList({ members, currentUserId }: MembersListProps) {
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
          {members.map((member) => (
            <List.Item key={member.userId}>
              <MemberAvatar name={member.name} />
              <List.ItemText>
                <Text size="sm" weight="medium" className="truncate">
                  {member.name}
                  {member.userId === currentUserId && (
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
              <Panel.RowBadge color={roleBadgeColor[member.role]}>
                {ROLE_LABELS[member.role]}
              </Panel.RowBadge>
            </List.Item>
          ))}
        </List.Root>
      </Panel.Body>
    </Panel.Root>
  );
}
