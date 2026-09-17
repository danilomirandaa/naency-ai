import { MemberAvatar } from '@/components/finance/MemberAvatar';
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
        <ul aria-label="Membros" className="flex flex-col">
          {members.map((member) => (
            <li
              key={member.userId}
              className="flex items-center gap-3 border-border-neutral-subtle border-b px-4 py-3 last:border-b-0"
            >
              <MemberAvatar name={member.name} />
              <div className="flex min-w-0 flex-1 flex-col">
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
              </div>
              <Panel.RowBadge color={roleBadgeColor[member.role]}>
                {ROLE_LABELS[member.role]}
              </Panel.RowBadge>
            </li>
          ))}
        </ul>
      </Panel.Body>
    </Panel.Root>
  );
}
