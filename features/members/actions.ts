'use server';

import { InvitationError, acceptInvitation, createInvitation, revokeInvitation } from '@/server/dal/members';
import { getActiveWorkspace, setActiveWorkspaceCookie } from '@/server/dal/workspaces';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { type AcceptInvitationState, type InviteMemberState, inviteMemberSchema } from './schemas';

const MEMBERS_PATH = '/membros';

async function requestOrigin() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get('origin') ??
    `${requestHeaders.get('x-forwarded-proto') ?? 'https'}://${requestHeaders.get('host')}`
  );
}

export async function inviteMemberAction(
  _previous: InviteMemberState,
  formData: FormData,
): Promise<InviteMemberState> {
  const typed = {
    email: typeof formData.get('email') === 'string' ? String(formData.get('email')) : '',
    role: typeof formData.get('role') === 'string' ? String(formData.get('role')) : '',
  };
  const parsed = inviteMemberSchema.safeParse(typed);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos.', ...typed };
  }

  const { active } = await getActiveWorkspace();
  if (!active) {
    return { status: 'error', message: 'Nenhum espaço ativo.', ...typed };
  }

  try {
    const { token, email } = await createInvitation(active.id, parsed.data);
    revalidatePath(MEMBERS_PATH);
    return { status: 'created', email, link: `${await requestOrigin()}/convite/${token}` };
  } catch (error) {
    const message =
      error instanceof InvitationError
        ? error.message
        : 'Não foi possível criar o convite. Tente de novo.';
    return { status: 'error', message, ...typed };
  }
}

export async function revokeInvitationAction(invitationId: string) {
  const { active } = await getActiveWorkspace();
  if (!active) {
    return;
  }
  await revokeInvitation(active.id, invitationId);
  revalidatePath(MEMBERS_PATH);
}

const ACCEPT_ERRORS: Record<string, string> = {
  'not-found': 'Convite não encontrado.',
  expired: 'Este convite expirou. Peça um novo.',
  used: 'Este convite já foi usado.',
  'email-mismatch': 'Este convite é para outro e-mail.',
};

// Usada com useActionState via bind(null, token); o estado anterior não importa.
export async function acceptInvitationAction(token: string): Promise<AcceptInvitationState> {
  const result = await acceptInvitation(token);
  if (result.status !== 'valid' && result.status !== 'already-member') {
    return { status: 'error', message: ACCEPT_ERRORS[result.status] ?? 'Convite inválido.' };
  }
  await setActiveWorkspaceCookie(result.invitation.workspaceId);
  redirect('/');
}
