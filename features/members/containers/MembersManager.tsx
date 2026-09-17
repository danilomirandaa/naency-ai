'use client';

import { DeleteDialog } from '@/components/ui/DeleteDialog';
import { Panel } from '@/components/ui/Panel';
import type { MemberActionResult } from '@/features/members/actions';
import { MembersList, type MembersListItem } from '@/features/members/components/MembersList';
import type { WorkspaceRole } from '@/lib/permissions';
import * as React from 'react';

export type MembersManagerProps = {
  members: MembersListItem[];
  currentUserId: string;
  canManage: boolean;
  changeRoleAction: (userId: string, role: WorkspaceRole) => Promise<MemberActionResult>;
  removeAction: (userId: string) => Promise<MemberActionResult>;
};

/** Container: confirmação de remoção e mensagens de erro em volta do MembersList. */
export function MembersManager({
  members,
  currentUserId,
  canManage,
  changeRoleAction,
  removeAction,
}: MembersManagerProps) {
  const [removing, setRemoving] = React.useState<MembersListItem | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const isSelf = removing?.userId === currentUserId;

  return (
    <>
      {error && (
        <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
          {error}
        </Panel.Callout>
      )}
      <MembersList
        members={members}
        currentUserId={currentUserId}
        canManage={canManage}
        onRoleChange={async (member, role) => {
          const result = await changeRoleAction(member.userId, role);
          setError(result.ok ? null : result.message);
        }}
        onRemove={setRemoving}
      />
      <DeleteDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={isSelf ? 'Sair do espaço' : 'Remover pessoa'}
        subtitle={
          isSelf
            ? 'Você perde o acesso a este espaço até receber um novo convite.'
            : `${removing?.name ?? ''} perde o acesso a este espaço.`
        }
        warnText="Os lançamentos feitos por essa pessoa continuam no espaço."
        deleteButtonText={isSelf ? 'Sair' : 'Remover'}
        deleteButtonIcon={isSelf ? 'logout' : 'delete'}
        onConfirm={async () => {
          if (!removing) {
            return;
          }
          const result = await removeAction(removing.userId);
          setError(result.ok ? null : result.message);
          setRemoving(null);
        }}
      />
    </>
  );
}
