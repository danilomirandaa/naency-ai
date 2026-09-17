import type { WorkspaceRole } from '@/lib/permissions';

/** Cookie com o id do espaço ativo. O servidor sempre revalida a participação. */
export const ACTIVE_WORKSPACE_COOKIE = 'naency_workspace';

export type WorkspaceSummary = {
  id: string;
  name: string;
  role: WorkspaceRole;
};

/**
 * Espaço ativo: o do cookie, se o usuário ainda for membro dele; senão o
 * primeiro da lista; sem espaços, `null` (vai para o onboarding).
 */
export function resolveActiveWorkspace(
  workspaces: WorkspaceSummary[],
  cookieValue: string | null | undefined,
): WorkspaceSummary | null {
  return workspaces.find((workspace) => workspace.id === cookieValue) ?? workspaces[0] ?? null;
}
