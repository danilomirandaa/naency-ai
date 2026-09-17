import 'server-only';
import { inviteMemberSchema } from '@/features/members/schemas';
import { type WorkspaceRole, isWorkspaceRole } from '@/lib/permissions';
import { UnauthenticatedError } from '@/server/auth/errors';
import { getCurrentUser } from '@/server/auth/current-user';
import { requireMembership } from '@/server/auth/membership';
import { getDb } from '@/server/db/client';
import { profiles, workspaceInvitations, workspaceMembers, workspaces } from '@/server/db/schema';
import { ensureProfile } from '@/server/dal/profiles';
import {
  type InvitationEvaluation,
  type InvitationRecord,
  evaluateInvitation,
  invitationExpiry,
} from '@/server/invitations/evaluate';
import {
  createInvitationToken,
  hashInvitationToken,
  isWellFormedInvitationToken,
} from '@/server/invitations/token';
import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm';
import { authUsers } from 'drizzle-orm/supabase';
import { z } from 'zod';

export type MemberDTO = {
  userId: string;
  name: string;
  email: string | null;
  role: WorkspaceRole;
  joinedAt: Date;
};

export type PendingInvitationDTO = {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: Date;
};

export class InvitationError extends Error {
  constructor(
    public readonly code: 'already-member',
    message: string,
  ) {
    super(message);
    this.name = 'InvitationError';
  }
}

export async function listMembers(workspaceId: string): Promise<MemberDTO[]> {
  await requireMembership(workspaceId, 'workspace.read');
  return getDb()
    .select({
      userId: workspaceMembers.userId,
      name: profiles.name,
      email: authUsers.email,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.joinedAt,
    })
    .from(workspaceMembers)
    .innerJoin(profiles, eq(profiles.id, workspaceMembers.userId))
    .innerJoin(authUsers, eq(authUsers.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(asc(workspaceMembers.joinedAt));
}

export async function listPendingInvitations(workspaceId: string): Promise<PendingInvitationDTO[]> {
  await requireMembership(workspaceId, 'members.manage');
  return getDb()
    .select({
      id: workspaceInvitations.id,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      expiresAt: workspaceInvitations.expiresAt,
    })
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        isNull(workspaceInvitations.acceptedAt),
        gt(workspaceInvitations.expiresAt, new Date()),
      ),
    )
    .orderBy(asc(workspaceInvitations.createdAt));
}

/**
 * Cria o convite e devolve o token (que só existe aqui e no link). Um convite
 * pendente anterior para o mesmo e-mail é substituído.
 */
export async function createInvitation(
  workspaceId: string,
  input: unknown,
): Promise<{ token: string; email: string }> {
  const { user } = await requireMembership(workspaceId, 'members.manage');
  const { email, role } = inviteMemberSchema.parse(input);
  const db = getDb();

  const [existingMember] = await db
    .select({ userId: workspaceMembers.userId })
    .from(workspaceMembers)
    .innerJoin(authUsers, eq(authUsers.id, workspaceMembers.userId))
    .where(
      and(eq(workspaceMembers.workspaceId, workspaceId), sql`lower(${authUsers.email}) = ${email}`),
    )
    .limit(1);
  if (existingMember) {
    throw new InvitationError('already-member', 'Essa pessoa já faz parte do espaço.');
  }

  const { token, tokenHash } = createInvitationToken();
  await db.transaction(async (tx) => {
    await tx
      .delete(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspaceId, workspaceId),
          isNull(workspaceInvitations.acceptedAt),
          sql`lower(${workspaceInvitations.email}) = ${email}`,
        ),
      );
    await tx.insert(workspaceInvitations).values({
      workspaceId,
      email,
      role,
      tokenHash,
      expiresAt: invitationExpiry(new Date()),
      invitedBy: user.id,
    });
  });

  return { token, email };
}

export async function revokeInvitation(workspaceId: string, invitationId: string) {
  await requireMembership(workspaceId, 'members.manage');
  await getDb()
    .delete(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.id, invitationId),
        eq(workspaceInvitations.workspaceId, workspaceId),
        isNull(workspaceInvitations.acceptedAt),
      ),
    );
}

async function findInvitation(token: string): Promise<InvitationRecord | null> {
  if (!isWellFormedInvitationToken(token)) {
    return null;
  }
  const [row] = await getDb()
    .select({
      id: workspaceInvitations.id,
      workspaceId: workspaceInvitations.workspaceId,
      workspaceName: workspaces.name,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      expiresAt: workspaceInvitations.expiresAt,
      acceptedAt: workspaceInvitations.acceptedAt,
    })
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvitations.workspaceId))
    .where(eq(workspaceInvitations.tokenHash, hashInvitationToken(token)))
    .limit(1);
  return row ?? null;
}

async function isMember(workspaceId: string, userId: string) {
  const [row] = await getDb()
    .select({ userId: workspaceMembers.userId })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);
  return Boolean(row);
}

/** Como o convite está para o usuário atual (tela /convite/[token]). */
export async function previewInvitation(token: string): Promise<InvitationEvaluation> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthenticatedError();
  }
  const invitation = await findInvitation(token);
  return evaluateInvitation({
    invitation,
    userEmail: user.email,
    isAlreadyMember: invitation ? await isMember(invitation.workspaceId, user.id) : false,
    now: new Date(),
  });
}

/** Aceita o convite. Marca como usado só se ainda não foi (duas abas ao mesmo tempo). */
export async function acceptInvitation(token: string): Promise<InvitationEvaluation> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthenticatedError();
  }
  const evaluation = await previewInvitation(token);
  if (evaluation.status !== 'valid') {
    return evaluation;
  }

  const { invitation } = evaluation;
  await ensureProfile(user);
  const accepted = await getDb().transaction(async (tx) => {
    const [marked] = await tx
      .update(workspaceInvitations)
      .set({ acceptedAt: new Date() })
      .where(and(eq(workspaceInvitations.id, invitation.id), isNull(workspaceInvitations.acceptedAt)))
      .returning({ id: workspaceInvitations.id });
    if (!marked) {
      return false;
    }
    await tx
      .insert(workspaceMembers)
      .values({ workspaceId: invitation.workspaceId, userId: user.id, role: invitation.role })
      .onConflictDoNothing();
    return true;
  });

  return accepted ? evaluation : { status: 'used' };
}

export class MemberError extends Error {
  constructor(
    public readonly code: 'not-found' | 'last-admin',
    message: string,
  ) {
    super(message);
    this.name = 'MemberError';
  }
}

const memberIdSchema = z.uuid();

type MembersTx = Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0];

/** O espaço nunca fica sem administrador; lança dentro da transação para desfazer. */
async function assertHasAdmin(tx: MembersTx, workspaceId: string) {
  const [row] = await tx
    .select({ admins: sql<number>`count(*)::int` })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.role, 'admin')));
  if (!row || row.admins === 0) {
    throw new MemberError('last-admin', 'O espaço precisa de pelo menos um administrador.');
  }
}

export async function changeMemberRole(workspaceId: string, userId: string, role: WorkspaceRole) {
  await requireMembership(workspaceId, 'members.manage');
  if (!memberIdSchema.safeParse(userId).success || !isWorkspaceRole(role)) {
    throw new MemberError('not-found', 'Membro não encontrado.');
  }
  await getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(workspaceMembers)
      .set({ role })
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
      .returning({ userId: workspaceMembers.userId });
    if (!updated) {
      throw new MemberError('not-found', 'Membro não encontrado.');
    }
    await assertHasAdmin(tx, workspaceId);
  });
}

/** Remove alguém (admin) ou sai do espaço (qualquer membro, sobre si mesmo). */
export async function removeMember(workspaceId: string, userId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthenticatedError();
  }
  await requireMembership(workspaceId, userId === user.id ? 'workspace.read' : 'members.manage');
  if (!memberIdSchema.safeParse(userId).success) {
    throw new MemberError('not-found', 'Membro não encontrado.');
  }
  await getDb().transaction(async (tx) => {
    const [removed] = await tx
      .delete(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
      .returning({ userId: workspaceMembers.userId });
    if (!removed) {
      throw new MemberError('not-found', 'Membro não encontrado.');
    }
    await assertHasAdmin(tx, workspaceId);
  });
}
