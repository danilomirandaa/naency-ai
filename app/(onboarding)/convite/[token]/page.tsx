import { AuthShell } from '@/components/layout/AuthShell';
import { signOutAction } from '@/features/auth/actions';
import { acceptInvitationAction } from '@/features/members/actions';
import {
  AcceptInvitation,
  type AcceptInvitationView,
} from '@/features/members/components/AcceptInvitation';
import { requireUser } from '@/server/auth/current-user';
import { previewInvitation } from '@/server/dal/members';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Convite · Naency',
};

export default async function InvitationPage({ params }: PageProps<'/convite/[token]'>) {
  const user = await requireUser();
  const { token } = await params;
  const evaluation = await previewInvitation(token);

  // DTO para o cliente: nunca envia o e-mail convidado completo nem ids internos.
  const view: AcceptInvitationView =
    evaluation.status === 'valid'
      ? {
          status: 'valid',
          workspaceName: evaluation.invitation.workspaceName,
          role: evaluation.invitation.role,
        }
      : evaluation.status === 'already-member'
        ? { status: 'already-member', workspaceName: evaluation.invitation.workspaceName }
        : evaluation.status === 'email-mismatch'
          ? {
              status: 'email-mismatch',
              invitedEmail: evaluation.invitedEmail,
              currentEmail: user.email,
            }
          : { status: evaluation.status };

  return (
    <AuthShell>
      <AcceptInvitation
        view={view}
        acceptAction={acceptInvitationAction.bind(null, token)}
        signOutAction={signOutAction}
      />
    </AuthShell>
  );
}
