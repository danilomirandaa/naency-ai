import { ForbiddenError } from '@/server/auth/errors';
import { createUser, resetTestDb, signInAs } from '@/tests/integration/db';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  acceptInvitation,
  changeMemberRole,
  createInvitation,
  listMembers,
  removeMember,
} from './members';
import { createWorkspace, listMyWorkspaces } from './workspaces';

type User = Awaited<ReturnType<typeof createUser>>;

let admin: User;
let workspaceId: string;

beforeEach(async () => {
  await resetTestDb();
  admin = await createUser('danilo@exemplo.com', { signIn: true });
  ({ id: workspaceId } = await createWorkspace({ name: 'Finanças da casa' }));
});

async function joinAs(email: string, role: 'editor' | 'viewer') {
  signInAs(admin);
  const { token } = await createInvitation(workspaceId, { email, role });
  const user = await createUser(email, { signIn: true });
  await acceptInvitation(token);
  signInAs(admin);
  return user;
}

async function roles() {
  const members = await listMembers(workspaceId);
  return Object.fromEntries(members.map((member) => [member.email, member.role]));
}

describe('papéis: trocar', () => {
  it('admin promove e rebaixa outros membros', async () => {
    const ana = await joinAs('ana@exemplo.com', 'viewer');
    await changeMemberRole(workspaceId, ana.id, 'editor');
    expect(await roles()).toEqual({ 'danilo@exemplo.com': 'admin', 'ana@exemplo.com': 'editor' });
    await changeMemberRole(workspaceId, ana.id, 'admin');
    await changeMemberRole(workspaceId, admin.id, 'viewer');
    signInAs(ana);
    expect(await roles()).toEqual({ 'danilo@exemplo.com': 'viewer', 'ana@exemplo.com': 'admin' });
  });

  it('o último admin não pode se rebaixar, e nada muda', async () => {
    await joinAs('ana@exemplo.com', 'editor');
    await expect(changeMemberRole(workspaceId, admin.id, 'editor')).rejects.toMatchObject({ code: 'last-admin' });
    expect((await roles())['danilo@exemplo.com']).toBe('admin');
  });

  it('editor e leitor não trocam papéis', async () => {
    const ana = await joinAs('ana@exemplo.com', 'editor');
    const carlos = await joinAs('carlos@exemplo.com', 'viewer');
    signInAs(ana);
    await expect(changeMemberRole(workspaceId, carlos.id, 'editor')).rejects.toBeInstanceOf(ForbiddenError);
    await expect(changeMemberRole(workspaceId, ana.id, 'admin')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('membro inexistente ou de outro espaço', async () => {
    const outsider = await createUser('fora@exemplo.com');
    await expect(changeMemberRole(workspaceId, outsider.id, 'editor')).rejects.toMatchObject({ code: 'not-found' });
    await expect(changeMemberRole(workspaceId, 'x', 'editor')).rejects.toMatchObject({ code: 'not-found' });
    await expect(
      changeMemberRole(workspaceId, admin.id, 'dono' as 'admin'),
    ).rejects.toMatchObject({ code: 'not-found' });
  });
});

describe('papéis: remover e sair', () => {
  it('admin remove outro membro, que perde o acesso', async () => {
    const ana = await joinAs('ana@exemplo.com', 'editor');
    await removeMember(workspaceId, ana.id);
    expect(Object.keys(await roles())).toEqual(['danilo@exemplo.com']);
    signInAs(ana);
    await expect(listMembers(workspaceId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listMyWorkspaces()).resolves.toEqual([]);
  });

  it('qualquer membro pode sair; editor não remove outros', async () => {
    const ana = await joinAs('ana@exemplo.com', 'editor');
    const carlos = await joinAs('carlos@exemplo.com', 'viewer');
    signInAs(ana);
    await expect(removeMember(workspaceId, carlos.id)).rejects.toBeInstanceOf(ForbiddenError);
    signInAs(carlos);
    await removeMember(workspaceId, carlos.id);
    signInAs(admin);
    expect(Object.keys(await roles())).toEqual(['danilo@exemplo.com', 'ana@exemplo.com']);
  });

  it('o último admin não sai nem é removido', async () => {
    await joinAs('ana@exemplo.com', 'editor');
    await expect(removeMember(workspaceId, admin.id)).rejects.toMatchObject({ code: 'last-admin' });
    expect(await roles()).toHaveProperty('danilo@exemplo.com', 'admin');
  });

  it('com outro admin, o admin pode sair', async () => {
    const ana = await joinAs('ana@exemplo.com', 'editor');
    await changeMemberRole(workspaceId, ana.id, 'admin');
    await removeMember(workspaceId, admin.id);
    signInAs(ana);
    expect(await roles()).toEqual({ 'ana@exemplo.com': 'admin' });
  });

  it('não-membro não remove ninguém', async () => {
    signInAs(await createUser('intruso@exemplo.com'));
    await expect(removeMember(workspaceId, admin.id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
