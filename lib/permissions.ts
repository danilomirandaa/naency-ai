/**
 * Papéis de um membro no espaço e o que cada um pode fazer (docs/domain.md).
 * Fonte única: o DAL usa para autorizar e a interface para esconder ações.
 */
export const WORKSPACE_ROLES = ['admin', 'editor', 'viewer'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const WORKSPACE_ACTIONS = [
  'workspace.read',
  'finance.write',
  'import.run',
  'members.manage',
  'workspace.manage',
] as const;
export type WorkspaceAction = (typeof WORKSPACE_ACTIONS)[number];

const permissions: Record<WorkspaceRole, readonly WorkspaceAction[]> = {
  admin: WORKSPACE_ACTIONS,
  editor: ['workspace.read', 'finance.write', 'import.run'],
  viewer: ['workspace.read'],
};

export function can(role: WorkspaceRole | null | undefined, action: WorkspaceAction) {
  return role != null && permissions[role].includes(action);
}

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return typeof value === 'string' && (WORKSPACE_ROLES as readonly string[]).includes(value);
}
