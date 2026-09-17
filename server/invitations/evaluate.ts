import type { WorkspaceRole } from '@/lib/permissions';

export type InvitationRecord = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: Date;
  acceptedAt: Date | null;
};

export type InvitationEvaluation =
  | { status: 'valid'; invitation: InvitationRecord }
  | { status: 'already-member'; invitation: InvitationRecord }
  | { status: 'not-found' }
  | { status: 'expired' }
  | { status: 'used' }
  | { status: 'email-mismatch'; invitedEmail: string };

export const INVITATION_TTL_DAYS = 7;

export function invitationExpiry(now: Date) {
  return new Date(now.getTime() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Mostra só o começo do e-mail convidado (d***@exemplo.com). */
export function maskEmail(email: string) {
  const [local = '', domain = ''] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}

/**
 * Regras para aceitar um convite. O e-mail de quem aceita precisa ser o
 * convidado: um link vazado não serve para outra pessoa.
 */
export function evaluateInvitation({
  invitation,
  userEmail,
  isAlreadyMember,
  now,
}: {
  invitation: InvitationRecord | null;
  userEmail: string | null;
  isAlreadyMember: boolean;
  now: Date;
}): InvitationEvaluation {
  if (!invitation) {
    return { status: 'not-found' };
  }
  if (invitation.acceptedAt) {
    return { status: 'used' };
  }
  if (invitation.expiresAt.getTime() <= now.getTime()) {
    return { status: 'expired' };
  }
  if (!userEmail || userEmail.trim().toLowerCase() !== invitation.email.trim().toLowerCase()) {
    return { status: 'email-mismatch', invitedEmail: maskEmail(invitation.email) };
  }
  if (isAlreadyMember) {
    return { status: 'already-member', invitation };
  }
  return { status: 'valid', invitation };
}
