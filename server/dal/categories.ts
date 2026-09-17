import 'server-only';
import { type CategoryInput, categoryInputSchema } from '@/features/categories/schemas';
import type { CategorySummary } from '@/features/categories/types';
import { type CategoryIconName, DEFAULT_CATEGORIES } from '@/lib/categories';
import { requireMembership } from '@/server/auth/membership';
import { getDb } from '@/server/db/client';
import { categories } from '@/server/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

export class CategoryError extends Error {
  constructor(
    public readonly code: 'not-found' | 'invalid-parent' | 'duplicate' | 'has-children',
    message: string,
  ) {
    super(message);
    this.name = 'CategoryError';
  }
}

type Db = ReturnType<typeof getDb>;
type Executor = Pick<Db, 'insert' | 'select' | 'update'>;

/** Semeia as categorias padrão num espaço recém-criado (mesma transação). */
export async function seedDefaultCategories(tx: Executor, workspaceId: string) {
  const roots = await tx
    .insert(categories)
    .values(
      DEFAULT_CATEGORIES.map(({ name, kind, icon, color }) => ({ workspaceId, name, kind, icon, color })),
    )
    .returning({ id: categories.id, name: categories.name, kind: categories.kind });

  const children = DEFAULT_CATEGORIES.flatMap((definition) => {
    const parent = roots.find((root) => root.name === definition.name && root.kind === definition.kind);
    return (definition.children ?? []).map((name) => ({
      workspaceId,
      parentId: parent?.id ?? null,
      name,
      kind: definition.kind,
      icon: definition.icon,
      color: definition.color,
    }));
  });
  if (children.length > 0) {
    await tx.insert(categories).values(children);
  }
}

export async function listCategories(
  workspaceId: string,
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<CategorySummary[]> {
  await requireMembership(workspaceId, 'workspace.read');
  const rows = await getDb()
    .select({
      id: categories.id,
      parentId: categories.parentId,
      name: categories.name,
      kind: categories.kind,
      icon: categories.icon,
      color: categories.color,
      archivedAt: categories.archivedAt,
    })
    .from(categories)
    .where(
      and(
        eq(categories.workspaceId, workspaceId),
        includeArchived ? undefined : isNull(categories.archivedAt),
      ),
    );

  // Ordem em pt-BR ("Água" junto do "A"); o Postgres do Supabase usa collation C.
  rows.sort((a, b) => collator.compare(a.name, b.name));
  return rows.map(({ archivedAt, icon, ...row }) => ({
    ...row,
    icon: icon as CategoryIconName,
    archived: archivedAt !== null,
  }));
}

function assertUuid(id: string) {
  if (!z.uuid().safeParse(id).success) {
    throw new CategoryError('not-found', 'Categoria não encontrada.');
  }
}

async function findCategory(workspaceId: string, id: string) {
  assertUuid(id);
  const [row] = await getDb()
    .select({ id: categories.id, parentId: categories.parentId, kind: categories.kind })
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.workspaceId, workspaceId)));
  return row ?? null;
}

/** Pai precisa ser do mesmo espaço, do mesmo tipo e de primeiro nível. */
async function assertValidParent(workspaceId: string, input: CategoryInput, selfId?: string) {
  if (!input.parentId) {
    return;
  }
  const parent = await findCategory(workspaceId, input.parentId).catch(() => null);
  if (!parent || parent.kind !== input.kind || parent.parentId !== null || parent.id === selfId) {
    throw new CategoryError('invalid-parent', 'Escolha uma categoria principal do mesmo tipo.');
  }
}

function isUniqueViolation(error: unknown) {
  const code = (error as { code?: string; cause?: { code?: string } })?.code ??
    (error as { cause?: { code?: string } })?.cause?.code;
  return code === '23505';
}

const duplicate = () => new CategoryError('duplicate', 'Já existe uma categoria com esse nome aqui.');

export async function createCategory(workspaceId: string, input: CategoryInput) {
  await requireMembership(workspaceId, 'finance.write');
  const data = categoryInputSchema.parse(input);
  await assertValidParent(workspaceId, data);
  try {
    const [row] = await getDb()
      .insert(categories)
      .values({ ...data, workspaceId })
      .returning({ id: categories.id });
    if (!row) {
      throw new Error('Falha ao criar a categoria.');
    }
    return row;
  } catch (error) {
    throw isUniqueViolation(error) ? duplicate() : error;
  }
}

export async function updateCategory(workspaceId: string, categoryId: string, input: CategoryInput) {
  await requireMembership(workspaceId, 'finance.write');
  const data = categoryInputSchema.parse(input);
  const current = await findCategory(workspaceId, categoryId);
  if (!current) {
    throw new CategoryError('not-found', 'Categoria não encontrada.');
  }
  // O tipo não muda: lançamentos já classificados ficariam incoerentes.
  if (data.kind !== current.kind) {
    throw new CategoryError('invalid-parent', 'O tipo da categoria não pode ser alterado.');
  }
  await assertValidParent(workspaceId, data, categoryId);
  if (data.parentId) {
    const [child] = await getDb()
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, categoryId))
      .limit(1);
    if (child) {
      throw new CategoryError('has-children', 'Uma categoria com subcategorias não pode virar subcategoria.');
    }
  }
  try {
    const [row] = await getDb()
      .update(categories)
      .set(data)
      .where(and(eq(categories.id, categoryId), eq(categories.workspaceId, workspaceId)))
      .returning({ id: categories.id });
    if (!row) {
      throw new CategoryError('not-found', 'Categoria não encontrada.');
    }
    return row;
  } catch (error) {
    throw isUniqueViolation(error) ? duplicate() : error;
  }
}

/** Arquivar a principal arquiva as subcategorias; desarquivar traz todas de volta. */
export async function setCategoryArchived(workspaceId: string, categoryId: string, archived: boolean) {
  await requireMembership(workspaceId, 'finance.write');
  const current = await findCategory(workspaceId, categoryId);
  if (!current) {
    throw new CategoryError('not-found', 'Categoria não encontrada.');
  }
  const archivedAt = archived ? new Date() : null;
  await getDb().transaction(async (tx) => {
    await tx
      .update(categories)
      .set({ archivedAt })
      .where(and(eq(categories.id, categoryId), eq(categories.workspaceId, workspaceId)));
    if (current.parentId === null) {
      await tx
        .update(categories)
        .set({ archivedAt })
        .where(and(eq(categories.parentId, categoryId), eq(categories.workspaceId, workspaceId)));
    } else if (!archived) {
      // Desarquivar subcategoria de pai arquivado traz o pai junto.
      await tx
        .update(categories)
        .set({ archivedAt: null })
        .where(and(eq(categories.id, current.parentId), eq(categories.workspaceId, workspaceId)));
    }
  });
  return { id: categoryId };
}
