import 'server-only';
import { createWorkspaceSchema } from '@/features/workspaces/schemas';
import {
  ACTIVE_WORKSPACE_COOKIE,
  type WorkspaceSummary,
  resolveActiveWorkspace,
} from '@/lib/workspaces/active';
import { UnauthenticatedError } from '@/server/auth/errors';
import { getCurrentUser } from '@/server/auth/current-user';
import { getDb } from '@/server/db/client';
import { workspaceMembers, workspaces } from '@/server/db/schema';
import { seedDefaultCategories } from '@/server/dal/categories';
import { ensureProfile } from '@/server/dal/profiles';
import { asc, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { cache } from 'react';

async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthenticatedError();
  }
  return user;
}

/** Espaços em que o usuário atual é membro, com o papel dele em cada um. */
export const listMyWorkspaces = cache(async (): Promise<WorkspaceSummary[]> => {
  const user = await requireCurrentUser();
  return getDb()
    .select({ id: workspaces.id, name: workspaces.name, role: workspaceMembers.role })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, user.id))
    .orderBy(asc(workspaces.name));
});

/** Espaços do usuário e o ativo (cookie validado contra a participação real). */
export const getActiveWorkspace = cache(async () => {
  const list = await listMyWorkspaces();
  const cookieStore = await cookies();
  return {
    workspaces: list,
    active: resolveActiveWorkspace(list, cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value),
  };
});

/** Cria o espaço com quem criou como administrador, numa transação. */
export async function createWorkspace(input: unknown): Promise<{ id: string }> {
  const { name } = createWorkspaceSchema.parse(input);
  const user = await requireCurrentUser();
  await ensureProfile(user);

  return getDb().transaction(async (tx) => {
    const [workspace] = await tx
      .insert(workspaces)
      .values({ name, createdBy: user.id })
      .returning({ id: workspaces.id });
    if (!workspace) {
      throw new Error('Falha ao criar o espaço.');
    }
    await tx
      .insert(workspaceMembers)
      .values({ workspaceId: workspace.id, userId: user.id, role: 'admin' });
    await seedDefaultCategories(tx, workspace.id);
    return workspace;
  });
}

export async function setActiveWorkspaceCookie(workspaceId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
  });
}
