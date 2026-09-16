import type { WorkspaceRole } from '@/lib/permissions';
import { describe, expect, it, vi } from 'vitest';
import { ForbiddenError, UnauthenticatedError } from './errors';
import { createMembershipGuard } from './membership-guard';

vi.mock('./current-user', () => ({}));

const WORKSPACE = '3f9a2c1e-8b7d-4e6f-9a1b-2c3d4e5f6a7b';
const user = { id: 'user-1', email: 'danilo@exemplo.com' };

function guardFor(role: WorkspaceRole | null, currentUser: typeof user | null = user) {
  const getMemberRole = vi.fn(async () => role);
  const requireMembership = createMembershipGuard({
    getCurrentUser: async () => currentUser,
    getMemberRole,
  });
  return { requireMembership, getMemberRole };
}

describe('requireMembership', () => {
  it('sem sessão lança UnauthenticatedError e não consulta o banco', async () => {
    const { requireMembership, getMemberRole } = guardFor('admin', null);
    await expect(requireMembership(WORKSPACE, 'workspace.read')).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
    expect(getMemberRole).not.toHaveBeenCalled();
  });

  it('quem não é membro não lê o espaço', async () => {
    const { requireMembership } = guardFor(null);
    await expect(requireMembership(WORKSPACE, 'workspace.read')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('id de espaço inválido é negado sem consultar o banco', async () => {
    const { requireMembership, getMemberRole } = guardFor('admin');
    await expect(requireMembership('nao-e-uuid', 'workspace.read')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(getMemberRole).not.toHaveBeenCalled();
  });

  it('leitor lê, mas não escreve, não importa e não gerencia membros', async () => {
    const { requireMembership } = guardFor('viewer');
    await expect(requireMembership(WORKSPACE, 'workspace.read')).resolves.toMatchObject({
      role: 'viewer',
    });
    for (const action of ['finance.write', 'import.run', 'members.manage'] as const) {
      await expect(requireMembership(WORKSPACE, action)).rejects.toBeInstanceOf(ForbiddenError);
    }
  });

  it('editor escreve e importa, mas não gerencia membros nem o espaço', async () => {
    const { requireMembership } = guardFor('editor');
    await expect(requireMembership(WORKSPACE, 'finance.write')).resolves.toMatchObject({
      role: 'editor',
    });
    await expect(requireMembership(WORKSPACE, 'import.run')).resolves.toBeDefined();
    await expect(requireMembership(WORKSPACE, 'members.manage')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(requireMembership(WORKSPACE, 'workspace.manage')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('admin pode tudo e recebe usuário, espaço e papel', async () => {
    const { requireMembership, getMemberRole } = guardFor('admin');
    await expect(requireMembership(WORKSPACE, 'members.manage')).resolves.toEqual({
      user,
      workspaceId: WORKSPACE,
      role: 'admin',
    });
    expect(getMemberRole).toHaveBeenCalledWith(WORKSPACE, user.id);
  });
});
