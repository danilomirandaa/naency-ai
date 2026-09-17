import { DEFAULT_CATEGORIES } from '@/lib/categories';
import { ForbiddenError } from '@/server/auth/errors';
import { createUser, resetTestDb, signInAs } from '@/tests/integration/db';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createCategory,
  listCategories,
  setCategoryArchived,
  updateCategory,
} from './categories';
import { acceptInvitation, createInvitation } from './members';
import { createWorkspace } from './workspaces';

type User = Awaited<ReturnType<typeof createUser>>;

let admin: User;
let workspaceId: string;

const input = {
  name: 'Crossfit',
  kind: 'expense' as const,
  parentId: null,
  icon: 'category-fitness' as const,
  color: '#0D9488',
};

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
  return user;
}

async function byName(name: string, kind: 'expense' | 'income' = 'expense') {
  const list = await listCategories(workspaceId, { includeArchived: true });
  const found = list.find((category) => category.name === name && category.kind === kind);
  if (!found) {
    throw new Error(`Categoria ${name} não encontrada`);
  }
  return found;
}

describe('categorias padrão', () => {
  it('espaço novo nasce com o conjunto padrão, com subcategorias ligadas ao pai', async () => {
    const list = await listCategories(workspaceId);
    const expectedCount = DEFAULT_CATEGORIES.reduce(
      (sum, category) => sum + 1 + (category.children?.length ?? 0),
      0,
    );
    expect(list).toHaveLength(expectedCount);

    const moradia = await byName('Moradia');
    const aluguel = await byName('Aluguel');
    expect(aluguel).toMatchObject({ parentId: moradia.id, kind: 'expense', icon: 'category-home' });
    expect(await byName('Salário', 'income')).toMatchObject({ parentId: null });
  });

  it('lista em ordem alfabética de pt-BR (acentos junto da letra)', async () => {
    const names = (await listCategories(workspaceId)).map((category) => category.name);
    expect(names.slice(0, 3)).toEqual(['Academia', 'Açougue', 'Água']);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'pt-BR')));
  });

  it('cada espaço tem as próprias categorias', async () => {
    const { id: other } = await createWorkspace({ name: 'Empresa' });
    await createCategory(other, input);
    const names = (await listCategories(workspaceId)).map((category) => category.name);
    expect(names).not.toContain('Crossfit');
  });
});

describe('categorias: CRUD e regras', () => {
  it('cria principal e subcategoria', async () => {
    const { id } = await createCategory(workspaceId, input);
    const saude = await byName('Saúde');
    await createCategory(workspaceId, { ...input, name: 'Dentista', parentId: saude.id });

    expect(await byName('Crossfit')).toMatchObject({ id, parentId: null, archived: false });
    expect(await byName('Dentista')).toMatchObject({ parentId: saude.id });
  });

  it('nome repetido no mesmo nível e tipo é recusado, sem diferenciar maiúsculas', async () => {
    await expect(createCategory(workspaceId, { ...input, name: 'mercado' })).rejects.toMatchObject({
      code: 'duplicate',
    });
    // Mesmo nome em outro tipo ou em outro nível pode.
    await expect(createCategory(workspaceId, { ...input, name: 'Mercado', kind: 'income' })).resolves.toBeTruthy();
    const moradia = await byName('Moradia');
    await expect(
      createCategory(workspaceId, { ...input, name: 'Mercado', parentId: moradia.id }),
    ).resolves.toBeTruthy();
  });

  it('pai precisa ser do mesmo tipo e de primeiro nível', async () => {
    const salario = await byName('Salário', 'income');
    const aluguel = await byName('Aluguel');
    await expect(
      createCategory(workspaceId, { ...input, parentId: salario.id }),
    ).rejects.toMatchObject({ code: 'invalid-parent' });
    await expect(
      createCategory(workspaceId, { ...input, parentId: aluguel.id }),
    ).rejects.toMatchObject({ code: 'invalid-parent' });
  });

  it('pai de outro espaço é recusado', async () => {
    const { id: other } = await createWorkspace({ name: 'Empresa' });
    const { id: foreign } = await createCategory(other, input);
    await expect(
      createCategory(workspaceId, { ...input, name: 'X', parentId: foreign }),
    ).rejects.toMatchObject({ code: 'invalid-parent' });
  });

  it('edita nome, ícone, cor e pai; tipo não muda', async () => {
    const { id } = await createCategory(workspaceId, input);
    const lazer = await byName('Lazer');
    await updateCategory(workspaceId, id, {
      ...input,
      name: 'Esportes',
      parentId: lazer.id,
      icon: 'category-leisure',
      color: '#DB2777',
    });
    expect(await byName('Esportes')).toMatchObject({
      parentId: lazer.id,
      icon: 'category-leisure',
      color: '#DB2777',
    });

    await expect(updateCategory(workspaceId, id, { ...input, kind: 'income' })).rejects.toMatchObject({
      code: 'invalid-parent',
    });
  });

  it('categoria com subcategorias não vira subcategoria, nem de si mesma', async () => {
    const moradia = await byName('Moradia');
    const lazer = await byName('Lazer');
    await expect(
      updateCategory(workspaceId, moradia.id, { ...input, name: 'Moradia', parentId: lazer.id }),
    ).rejects.toMatchObject({ code: 'has-children' });
    await expect(
      updateCategory(workspaceId, lazer.id, { ...input, name: 'Lazer', parentId: lazer.id }),
    ).rejects.toMatchObject({ code: 'invalid-parent' });
  });

  it('arquivar a principal leva as subcategorias; desarquivar a sub traz o pai', async () => {
    const moradia = await byName('Moradia');
    await setCategoryArchived(workspaceId, moradia.id, true);

    const active = (await listCategories(workspaceId)).map((category) => category.name);
    expect(active).not.toContain('Moradia');
    expect(active).not.toContain('Aluguel');

    const aluguel = await byName('Aluguel');
    await setCategoryArchived(workspaceId, aluguel.id, false);
    expect(await byName('Moradia')).toMatchObject({ archived: false });
    expect(await byName('Aluguel')).toMatchObject({ archived: false });
    expect(await byName('Energia')).toMatchObject({ archived: true });
  });

  it('não edita nem arquiva categoria de outro espaço', async () => {
    const { id: other } = await createWorkspace({ name: 'Empresa' });
    const { id } = await createCategory(other, input);
    await expect(updateCategory(workspaceId, id, input)).rejects.toMatchObject({ code: 'not-found' });
    await expect(setCategoryArchived(workspaceId, id, true)).rejects.toMatchObject({ code: 'not-found' });
    await expect(setCategoryArchived(workspaceId, 'x', true)).rejects.toMatchObject({ code: 'not-found' });
  });
});

describe('categorias: papéis', () => {
  it('editor cria e arquiva; leitor só lê', async () => {
    await joinAs('esposa@exemplo.com', 'editor');
    const { id } = await createCategory(workspaceId, input);
    await setCategoryArchived(workspaceId, id, true);

    const viewer = await joinAs('filho@exemplo.com', 'viewer');
    signInAs(viewer);
    await expect(listCategories(workspaceId)).resolves.not.toHaveLength(0);
    await expect(createCategory(workspaceId, { ...input, name: 'Y' })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(updateCategory(workspaceId, id, input)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(setCategoryArchived(workspaceId, id, false)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('quem não é membro não lê', async () => {
    signInAs(await createUser('intruso@exemplo.com'));
    await expect(listCategories(workspaceId)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
