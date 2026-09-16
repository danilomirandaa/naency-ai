import 'server-only';
import type { CurrentUser } from '@/server/auth/current-user';
import { getDb } from '@/server/db/client';
import { profiles, workspaceMembers } from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';
import type { WorkspaceRole } from '@/lib/permissions';

export type ProfileDTO = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

/** Nome inicial a partir do e-mail; a pessoa pode trocar depois. */
export function defaultProfileName(email: string | null) {
  const localPart = email?.split('@')[0]?.trim();
  return localPart ? localPart : 'Usuário';
}

/** Cria o perfil no primeiro acesso. Idempotente. */
export async function ensureProfile(user: CurrentUser): Promise<void> {
  await getDb()
    .insert(profiles)
    .values({ id: user.id, name: defaultProfileName(user.email) })
    .onConflictDoNothing({ target: profiles.id });
}

export async function getProfile(userId: string): Promise<ProfileDTO | null> {
  const [row] = await getDb()
    .select({ id: profiles.id, name: profiles.name, avatarUrl: profiles.avatarUrl })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return row ?? null;
}

export async function getMemberRole(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceRole | null> {
  const [row] = await getDb()
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);
  return row?.role ?? null;
}
