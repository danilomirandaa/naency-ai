import { type WorkspaceAction, type WorkspaceRole, can } from '@/lib/permissions';
import { z } from 'zod';
import { ForbiddenError, UnauthenticatedError } from './errors';
import type { CurrentUser } from './current-user';

export type MembershipGuardDeps = {
  getCurrentUser: () => Promise<CurrentUser | null>;
  getMemberRole: (workspaceId: string, userId: string) => Promise<WorkspaceRole | null>;
};

export type Membership = {
  user: CurrentUser;
  workspaceId: string;
  role: WorkspaceRole;
};

const workspaceIdSchema = z.uuid();

/**
 * Autorização de toda função do DAL: exige sessão, exige que o usuário seja
 * membro do espaço e que o papel dele permita a ação (lib/permissions.ts).
 * Espaço inexistente e espaço de outra pessoa dão o mesmo erro, para não revelar
 * quais ids existem.
 */
export function createMembershipGuard(deps: MembershipGuardDeps) {
  return async function requireMembership(
    workspaceId: string,
    action: WorkspaceAction,
  ): Promise<Membership> {
    const user = await deps.getCurrentUser();
    if (!user) {
      throw new UnauthenticatedError();
    }

    if (!workspaceIdSchema.safeParse(workspaceId).success) {
      throw new ForbiddenError();
    }

    const role = await deps.getMemberRole(workspaceId, user.id);
    if (!can(role, action) || !role) {
      throw new ForbiddenError();
    }

    return { user, workspaceId, role };
  };
}
