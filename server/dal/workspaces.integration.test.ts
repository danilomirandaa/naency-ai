import { ACTIVE_WORKSPACE_COOKIE } from '@/lib/workspaces/active';
import { UnauthenticatedError } from '@/server/auth/errors';
import { profiles, workspaceMembers } from '@/server/db/schema';
import { cookieJar } from '@/tests/integration/setup';
import { createUser, getTestDb, resetTestDb, signInAs } from '@/tests/integration/db';
import { ZodError } from 'zod';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createWorkspace,
  getActiveWorkspace,
  listMyWorkspaces,
  setActiveWorkspaceCookie,
} from './workspaces';

beforeEach(async () => {
  await resetTestDb();
  cookieJar.clear();
});

describe('createWorkspace', () => {
  it('cria o espaço com quem criou como admin e cria o perfil se faltar', async () => {
    const danilo = await createUser('danilo@exemplo.com', { signIn: true });

    const { id } = await createWorkspace({ name: '  Finanças da casa ' });

    const members = await getTestDb().select().from(workspaceMembers);
    expect(members).toEqual([
      expect.objectContaining({ workspaceId: id, userId: danilo.id, role: 'admin' }),
    ]);
    const [profile] = await getTestDb().select().from(profiles);
    expect(profile).toMatchObject({ id: danilo.id, name: 'danilo' });
    await expect(listMyWorkspaces()).resolves.toEqual([
      { id, name: 'Finanças da casa', role: 'admin' },
    ]);
  });

  it('sem sessão não cria', async () => {
    await expect(createWorkspace({ name: 'Casa' })).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('nome inválido não cria nada', async () => {
    await createUser('danilo@exemplo.com', { signIn: true });
    await expect(createWorkspace({ name: 'a' })).rejects.toBeInstanceOf(ZodError);
    await expect(getTestDb().select().from(workspaceMembers)).resolves.toEqual([]);
  });
});

describe('listMyWorkspaces e espaço ativo', () => {
  it('cada pessoa só vê os próprios espaços, em ordem alfabética', async () => {
    const danilo = await createUser('danilo@exemplo.com', { signIn: true });
    const { id: casa } = await createWorkspace({ name: 'Finanças da casa' });
    const { id: praia } = await createWorkspace({ name: 'Casa da praia' });

    await createUser('outra@exemplo.com', { signIn: true });
    await createWorkspace({ name: 'Espaço de outra pessoa' });

    signInAs(danilo);
    await expect(listMyWorkspaces()).resolves.toEqual([
      { id: praia, name: 'Casa da praia', role: 'admin' },
      { id: casa, name: 'Finanças da casa', role: 'admin' },
    ]);
  });

  it('usa o espaço do cookie e ignora cookie de espaço alheio', async () => {
    const danilo = await createUser('danilo@exemplo.com', { signIn: true });
    const { id: casa } = await createWorkspace({ name: 'Finanças da casa' });
    const { id: praia } = await createWorkspace({ name: 'Casa da praia' });
    await createUser('outra@exemplo.com', { signIn: true });
    const { id: alheio } = await createWorkspace({ name: 'Alheio' });
    signInAs(danilo);

    await setActiveWorkspaceCookie(casa);
    expect(cookieJar.get(ACTIVE_WORKSPACE_COOKIE)).toBe(casa);
    await expect(getActiveWorkspace()).resolves.toMatchObject({ active: { id: casa } });

    cookieJar.set(ACTIVE_WORKSPACE_COOKIE, alheio);
    // Cookie de espaço em que não é membro cai no primeiro da lista.
    await expect(getActiveWorkspace()).resolves.toMatchObject({ active: { id: praia } });
  });

  it('sem espaços, não há ativo (vai para o onboarding)', async () => {
    await createUser('nova@exemplo.com', { signIn: true });
    await expect(getActiveWorkspace()).resolves.toEqual({ workspaces: [], active: null });
  });
});
