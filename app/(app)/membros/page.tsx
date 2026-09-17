import { PageHeader } from '@/components/layout/PageHeader';
import {
  changeMemberRoleAction,
  inviteMemberAction,
  removeMemberAction,
  revokeInvitationAction,
} from '@/features/members/actions';
import { InviteMemberDialog } from '@/features/members/components/InviteMemberDialog';
import { MembersManager } from '@/features/members/containers/MembersManager';
import { PendingInvitations } from '@/features/members/components/PendingInvitations';
import { can } from '@/lib/permissions';
import { requireUser } from '@/server/auth/current-user';
import { listMembers, listPendingInvitations } from '@/server/dal/members';
import { getActiveWorkspace } from '@/server/dal/workspaces';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Membros · Naency',
};

export default async function MembersPage() {
  const user = await requireUser();
  const { active } = await getActiveWorkspace();
  if (!active) {
    redirect('/comecar');
  }

  const canManage = can(active.role, 'members.manage');
  const [members, invitations] = await Promise.all([
    listMembers(active.id),
    canManage ? listPendingInvitations(active.id) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHeader
        title="Membros"
        description={`Quem tem acesso a ${active.name}.`}
        actions={canManage ? <InviteMemberDialog action={inviteMemberAction} /> : undefined}
      />
      <MembersManager
        members={members}
        currentUserId={user.id}
        canManage={canManage}
        changeRoleAction={changeMemberRoleAction}
        removeAction={removeMemberAction}
      />
      {canManage && (
        <PendingInvitations
          invitations={invitations}
          revokeAction={revokeInvitationAction}
          now={new Date()}
        />
      )}
    </div>
  );
}
