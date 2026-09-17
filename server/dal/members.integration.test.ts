import { ForbiddenError, UnauthenticatedError } from '@/server/auth/errors';
import { workspaceInvitations, workspaceMembers } from '@/server/db/schema';
import { createUser, getTestDb, resetTestDb, signInAs } from '@/tests/integration/db';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  InvitationError,
  acceptInvitation,
  createInvitation,
  listMembers,
  listPendingInvitations,
  previewInvitation,
  revokeInvitation,
} from './members';
import { createWorkspace } from './workspaces';

type User = Awaited<ReturnType<typeof createUser>>;

let admin: User;
let workspaceId: string;

beforeEach(async () => {
  await resetTestDb();
  admin = await createUser('danilo@exemplo.com', { signIn: true });
  ({ id: workspaceId } = await createWorkspace({ name: 'Finanças da casa' }));
});

async function invite(email: string, role: 'editor' | 'viewer' = 'editor') {
  signInAs(admin);
  return createInvitation(workspaceId, { email, role });
}

async function joinAs(email: string, role: 'editor' | 'viewer') {
  const { token } = await invite(email, role);
  const user = await createUser(email, { signIn: true });
  await acceptInvitation(token);
  return user;
}

describe('convite: fluxo completo', () => {
  it('admin convida, a pessoa convidada aceita e entra com o papel escolhido', async () => {
    const { token, email } = await invite('Esposa@Exemplo.com', 'editor');
    expect(email).toBe('esposa@exemplo.com');

    // O banco guarda só o hash.
    const [stored] = await getTestDb().select().from(workspaceInvitations);
    expect(stored?.tokenHash).not.toBe(token);
    expect(stored?.tokenHash).toMatch(/^[0-9a-f]{64}$/);

    const esposa = await createUser('esposa@exemplo.com', { signIn: true });
    await expect(previewInvitation(token)).resolves.toMatchObject({ status: 'valid' });
    await expect(acceptInvitation(token)).resolves.toMatchObject({ status: 'valid' });

    signInAs(admin);
    await expect(listMembers(workspaceId)).resolves.toEqual([
      expect.objectContaining({ userId: admin.id, email: 'danilo@exemplo.com', role: 'admin' }),
      expect.objectContaining({ userId: esposa.id, email: 'esposa@exemplo.com', role: 'editor' }),
    ]);
    await expect(listPendingInvitations(workspaceId)).resolves.toEqual([]);
  });

  it('link vazado: outra pessoa não aceita e não vê o e-mail completo', async () => {
    const { token } = await invite('esposa@exemplo.com');
    await createUser('intruso@exemplo.com', { signIn: true });

    await expect(acceptInvitation(token)).resolves.toEqual({
      status: 'email-mismatch',
      invitedEmail: 'e***@exemplo.com',
    });
    const members = await getTestDb().select().from(workspaceMembers);
    expect(members).toHaveLength(1);
  });

  it('convite é de uso único', async () => {
    const { token } = await invite('esposa@exemplo.com');
    await createUser('esposa@exemplo.com', { signIn: true });
    await acceptInvitation(token);
    await expect(acceptInvitation(token)).resolves.toEqual({ status: 'used' });
  });

  it('aceites simultâneos do mesmo link criam um único aceite', async () => {
    const { token } = await invite('esposa@exemplo.com');
    await createUser('esposa@exemplo.com', { signIn: true });

    const results = await Promise.all([acceptInvitation(token), acceptInvitation(token)]);

    expect(results.map((result) => result.status).sort()).toEqual(['used', 'valid']);
    const members = await getTestDb()
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));
    expect(members).toHaveLength(2);
  });

  it('convite expirado não aceita', async () => {
    const { token } = await invite('esposa@exemplo.com');
    await getTestDb()
      .update(workspaceInvitations)
      .set({ expiresAt: new Date(Date.now() - 1000) });
    await createUser('esposa@exemplo.com', { signIn: true });
    await expect(acceptInvitation(token)).resolves.toEqual({ status: 'expired' });
  });

  it('token inexistente ou malformado não é encontrado', async () => {
    await createUser('esposa@exemplo.com', { signIn: true });
    await expect(previewInvitation('x'.repeat(43))).resolves.toEqual({ status: 'not-found' });
    await expect(previewInvitation("' or 1=1 --")).resolves.toEqual({ status: 'not-found' });
  });

  it('aceitar sem sessão lança UnauthenticatedError', async () => {
    const { token } = await invite('esposa@exemplo.com');
    signInAs(null);
    await expect(acceptInvitation(token)).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});

describe('convite: regras de criação', () => {
  it('não convida quem já é membro', async () => {
    await expect(invite('DANILO@exemplo.com')).rejects.toBeInstanceOf(InvitationError);
  });

  it('convidar de novo o mesmo e-mail substitui o pendente (link antigo deixa de valer)', async () => {
    const first = await invite('esposa@exemplo.com', 'viewer');
    const second = await invite('ESPOSA@exemplo.com', 'editor');

    await expect(listPendingInvitations(workspaceId)).resolves.toEqual([
      expect.objectContaining({ email: 'esposa@exemplo.com', role: 'editor' }),
    ]);
    await createUser('esposa@exemplo.com', { signIn: true });
    await expect(previewInvitation(first.token)).resolves.toEqual({ status: 'not-found' });
    await expect(previewInvitation(second.token)).resolves.toMatchObject({ status: 'valid' });
  });

  it('não permite convidar como admin', async () => {
    signInAs(admin);
    await expect(
      createInvitation(workspaceId, { email: 'x@exemplo.com', role: 'admin' }),
    ).rejects.toThrow();
  });

  it('cancelar convite invalida o link', async () => {
    const { token } = await invite('esposa@exemplo.com');
    const [pending] = await listPendingInvitations(workspaceId);
    await revokeInvitation(workspaceId, pending?.id ?? '');
    await createUser('esposa@exemplo.com', { signIn: true });
    await expect(previewInvitation(token)).resolves.toEqual({ status: 'not-found' });
  });
});

describe('permissões por papel', () => {
  it('editor lista membros, mas não convida, não vê nem cancela convites', async () => {
    const pending = await invite('pendente@exemplo.com');
    await joinAs('editor@exemplo.com', 'editor');

    await expect(listMembers(workspaceId)).resolves.toHaveLength(2);
    await expect(
      createInvitation(workspaceId, { email: 'novo@exemplo.com', role: 'viewer' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listPendingInvitations(workspaceId)).rejects.toBeInstanceOf(ForbiddenError);

    const [invitation] = await getTestDb().select().from(workspaceInvitations);
    await expect(revokeInvitation(workspaceId, invitation?.id ?? '')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(pending.token).toBeTruthy();
  });

  it('leitor só lista membros', async () => {
    await joinAs('leitor@exemplo.com', 'viewer');
    await expect(listMembers(workspaceId)).resolves.toHaveLength(2);
    await expect(
      createInvitation(workspaceId, { email: 'novo@exemplo.com', role: 'viewer' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('quem não é membro não vê nada do espaço', async () => {
    await createUser('estranho@exemplo.com', { signIn: true });
    await expect(listMembers(workspaceId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listPendingInvitations(workspaceId)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
