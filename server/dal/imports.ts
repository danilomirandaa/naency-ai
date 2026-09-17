import 'server-only';
import {
  type CreateImportInput,
  type UpdateImportRowInput,
  createImportSchema,
  updateImportRowSchema,
} from '@/features/imports/schemas';
import type { ImportBatchDetail, ImportBatchSummary, ImportRowItem } from '@/features/imports/types';
import { parseStatement } from '@/lib/import/parse';
import { matchRule, suggestRulePattern } from '@/lib/import/rules';
import { StatementParseError } from '@/lib/import/types';
import { inferPaymentMethod } from '@/lib/transactions';
import { requireMembership } from '@/server/auth/membership';
import { getDb } from '@/server/db/client';
import {
  accounts,
  aiUsageEvents,
  categories,
  categorizationRules,
  importBatches,
  importRows,
  institutions,
  transactions,
} from '@/server/db/schema';
import type { Enricher } from '@/server/ai/enrich';
import { resolveInvoiceId } from '@/server/dal/transactions';
import { fingerprintAll } from '@/server/import/fingerprint';
import { and, asc, count, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

export class ImportError extends Error {
  constructor(
    public readonly code: 'not-found' | 'invalid-account' | 'parse' | 'not-in-review' | 'invalid-category',
    message: string,
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

const DUPLICATE_WINDOW_DAYS = 2;

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function dayDistance(a: string, b: string) {
  return Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;
}

/** Lê o arquivo, sugere categorias pela memória e marca duplicados; nada vira lançamento ainda. */
export async function createImportBatch(workspaceId: string, input: CreateImportInput) {
  const { user } = await requireMembership(workspaceId, 'import.run');
  const data = createImportSchema.parse(input);
  const db = getDb();

  const [account] = await db
    .select({ id: accounts.id, type: accounts.type, archivedAt: accounts.archivedAt })
    .from(accounts)
    .where(and(eq(accounts.id, data.accountId), eq(accounts.workspaceId, workspaceId)));
  if (!account || account.archivedAt) {
    throw new ImportError('invalid-account', 'Conta não encontrada ou arquivada.');
  }

  let statement: ReturnType<typeof parseStatement>;
  try {
    statement = parseStatement(data.fileName, data.text, { accountType: account.type });
  } catch (error) {
    if (error instanceof StatementParseError) {
      throw new ImportError('parse', error.message);
    }
    throw error;
  }

  const rows = statement.rows.map((row) => ({ ...row, accountId: account.id, description: row.description }));
  const fingerprints = fingerprintAll(rows);

  const [rules, categoryKinds, existing] = await Promise.all([
    db
      .select({
        id: categorizationRules.id,
        matchType: categorizationRules.matchType,
        pattern: categorizationRules.pattern,
        categoryId: categorizationRules.categoryId,
        source: categorizationRules.source,
      })
      .from(categorizationRules)
      .where(eq(categorizationRules.workspaceId, workspaceId)),
    db
      .select({ id: categories.id, kind: categories.kind, archivedAt: categories.archivedAt })
      .from(categories)
      .where(eq(categories.workspaceId, workspaceId)),
    db
      .select({
        id: transactions.id,
        date: transactions.date,
        amountCents: transactions.amountCents,
        fingerprint: transactions.fingerprint,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, account.id),
          isNull(transactions.deletedAt),
          gte(transactions.date, shiftDate(rows.reduce((min, row) => (row.date < min ? row.date : min), rows[0]?.date ?? '9999-12-31'), -DUPLICATE_WINDOW_DAYS)),
          lte(transactions.date, shiftDate(rows.reduce((max, row) => (row.date > max ? row.date : max), rows[0]?.date ?? '0000-01-01'), DUPLICATE_WINDOW_DAYS)),
        ),
      ),
  ]);

  const usedExisting = new Set<string>();
  const prepared = rows.map((row, index) => {
    const fingerprint = fingerprints[index] as string;
    const exact = existing.find((item) => item.fingerprint === fingerprint && !usedExisting.has(item.id));
    const possible =
      exact ??
      existing.find(
        (item) =>
          !usedExisting.has(item.id) &&
          item.amountCents === row.amountCents &&
          dayDistance(item.date, row.date) <= DUPLICATE_WINDOW_DAYS,
      );
    if (possible) {
      usedExisting.add(possible.id);
    }
    const rule = matchRule(row.description, rules);
    const ruleCategory = rule ? categoryKinds.find((category) => category.id === rule.categoryId) : undefined;
    const kind = row.amountCents > 0 ? 'income' : 'expense';
    const useRule = ruleCategory && ruleCategory.kind === kind && !ruleCategory.archivedAt;
    return {
      position: index + 1,
      date: row.date,
      amountCents: row.amountCents,
      description: row.description,
      rawDescription: row.description,
      categoryId: useRule ? ruleCategory.id : null,
      ruleId: useRule ? (rule?.id ?? null) : null,
      include: !possible,
      fingerprint,
      duplicateOfTransactionId: possible?.id ?? null,
    };
  });

  return db.transaction(async (tx) => {
    const [batch] = await tx
      .insert(importBatches)
      .values({
        workspaceId,
        accountId: account.id,
        fileName: data.fileName,
        format: statement.format,
        layout: statement.layout,
        createdBy: user.id,
      })
      .returning({ id: importBatches.id });
    if (!batch) {
      throw new Error('Falha ao criar a importação.');
    }
    for (let start = 0; start < prepared.length; start += 500) {
      await tx.insert(importRows).values(prepared.slice(start, start + 500).map((row) => ({ ...row, batchId: batch.id })));
    }
    return { id: batch.id, rowCount: prepared.length };
  });
}

async function findBatch(workspaceId: string, batchId: string) {
  if (!z.uuid().safeParse(batchId).success) {
    throw new ImportError('not-found', 'Importação não encontrada.');
  }
  const [batch] = await getDb()
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.id, batchId), eq(importBatches.workspaceId, workspaceId)));
  if (!batch) {
    throw new ImportError('not-found', 'Importação não encontrada.');
  }
  return batch;
}

export async function getImportBatch(workspaceId: string, batchId: string): Promise<ImportBatchDetail> {
  await requireMembership(workspaceId, 'workspace.read');
  const batch = await findBatch(workspaceId, batchId);
  const db = getDb();
  const [[account], rows] = await Promise.all([
    db
      .select({
        id: accounts.id,
        name: accounts.name,
        type: accounts.type,
        institutionName: institutions.name,
        institutionColor: institutions.color,
      })
      .from(accounts)
      .leftJoin(institutions, eq(institutions.id, accounts.institutionId))
      .where(eq(accounts.id, batch.accountId)),
    db
      .select({
        id: importRows.id,
        position: importRows.position,
        date: importRows.date,
        amountCents: importRows.amountCents,
        description: importRows.description,
        rawDescription: importRows.rawDescription,
        categoryId: importRows.categoryId,
        ruleId: importRows.ruleId,
        aiSuggested: importRows.aiSuggested,
        include: importRows.include,
        rememberCategory: importRows.rememberCategory,
        fingerprint: importRows.fingerprint,
        duplicateOfTransactionId: importRows.duplicateOfTransactionId,
        duplicateFingerprint: transactions.fingerprint,
      })
      .from(importRows)
      .leftJoin(transactions, eq(transactions.id, importRows.duplicateOfTransactionId))
      .where(eq(importRows.batchId, batch.id))
      .orderBy(asc(importRows.position)),
  ]);
  if (!account) {
    throw new ImportError('not-found', 'Importação não encontrada.');
  }

  const items: ImportRowItem[] = rows.map((row) => ({
    id: row.id,
    position: row.position,
    date: row.date,
    amountCents: row.amountCents,
    description: row.description,
    rawDescription: row.rawDescription,
    categoryId: row.categoryId,
    suggestedByRule: row.ruleId !== null,
    suggestedByAi: row.aiSuggested,
    include: row.include,
    rememberCategory: row.rememberCategory,
    duplicate: row.duplicateOfTransactionId
      ? row.duplicateFingerprint === row.fingerprint
        ? 'exact'
        : 'possible'
      : null,
  }));
  const included = items.filter((item) => item.include);

  return {
    id: batch.id,
    fileName: batch.fileName,
    layout: batch.layout,
    status: batch.status,
    account: {
      id: account.id,
      name: account.name,
      type: account.type,
      institution:
        account.institutionName && account.institutionColor
          ? { name: account.institutionName, color: account.institutionColor }
          : null,
    },
    rows: items,
    summary: {
      total: items.length,
      included: included.length,
      duplicates: items.filter((item) => item.duplicate).length,
      uncategorized: included.filter((item) => !item.categoryId).length,
      incomeCents: included.filter((item) => item.amountCents > 0).reduce((sum, item) => sum + item.amountCents, 0),
      expenseCents: included.filter((item) => item.amountCents < 0).reduce((sum, item) => sum + item.amountCents, 0),
    },
  };
}

export async function updateImportRow(workspaceId: string, rowId: string, input: UpdateImportRowInput) {
  await requireMembership(workspaceId, 'import.run');
  const data = updateImportRowSchema.parse(input);
  if (!z.uuid().safeParse(rowId).success) {
    throw new ImportError('not-found', 'Linha não encontrada.');
  }
  const db = getDb();
  const [row] = await db
    .select({ id: importRows.id, amountCents: importRows.amountCents, status: importBatches.status })
    .from(importRows)
    .innerJoin(importBatches, eq(importBatches.id, importRows.batchId))
    .where(and(eq(importRows.id, rowId), eq(importBatches.workspaceId, workspaceId)));
  if (!row) {
    throw new ImportError('not-found', 'Linha não encontrada.');
  }
  if (row.status !== 'review') {
    throw new ImportError('not-in-review', 'Esta importação já foi concluída.');
  }
  if (data.categoryId) {
    const [category] = await db
      .select({ kind: categories.kind })
      .from(categories)
      .where(and(eq(categories.id, data.categoryId), eq(categories.workspaceId, workspaceId), isNull(categories.archivedAt)));
    if (!category || category.kind !== (row.amountCents > 0 ? 'income' : 'expense')) {
      throw new ImportError('invalid-category', 'Escolha uma categoria do mesmo tipo do lançamento.');
    }
  }
  await db
    .update(importRows)
    .set({
      ...data,
      // Categoria escolhida à mão deixa de ser sugestão de regra.
      ...(data.categoryId !== undefined ? { ruleId: null, aiSuggested: false } : {}),
    })
    .where(eq(importRows.id, rowId));
}

/** Cria os lançamentos das linhas incluídas, as regras "lembrar" e conclui a importação. */
export async function commitImportBatch(workspaceId: string, batchId: string) {
  const { user } = await requireMembership(workspaceId, 'import.run');
  const batch = await findBatch(workspaceId, batchId);
  if (batch.status !== 'review') {
    throw new ImportError('not-in-review', 'Esta importação já foi concluída.');
  }
  return getDb().transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(importRows)
      .where(and(eq(importRows.batchId, batch.id), eq(importRows.include, true)))
      .orderBy(asc(importRows.position));

    const [account] = await tx
      .select({ type: accounts.type })
      .from(accounts)
      .where(eq(accounts.id, batch.accountId));
    for (const row of rows) {
      const kind = row.amountCents > 0 ? 'income' : 'expense';
      await tx.insert(transactions).values({
        workspaceId,
        accountId: batch.accountId,
        kind,
        amountCents: row.amountCents,
        date: row.date,
        description: row.description,
        rawDescription: row.rawDescription,
        categoryId: row.categoryId,
        status: 'cleared',
        paidAt: row.date,
        paymentMethod: inferPaymentMethod(row.rawDescription, account?.type ?? ''),
        importBatchId: batch.id,
        fingerprint: row.fingerprint,
        invoiceId: await resolveInvoiceId(tx, workspaceId, batch.accountId, row.date),
        createdBy: user.id,
        updatedBy: user.id,
      });
    }

    for (const row of rows.filter((item) => item.rememberCategory && item.categoryId)) {
      const pattern = suggestRulePattern(row.rawDescription);
      if (pattern.length < 3) {
        continue;
      }
      await tx
        .insert(categorizationRules)
        .values({ workspaceId, pattern, categoryId: row.categoryId as string, source: 'user', matchType: 'contains' })
        .onConflictDoUpdate({
          target: [
            categorizationRules.workspaceId,
            categorizationRules.matchType,
            categorizationRules.pattern,
            categorizationRules.source,
          ],
          set: { categoryId: row.categoryId as string },
        });
    }

    const usedRules = [...new Set(rows.map((row) => row.ruleId).filter((id): id is string => Boolean(id)))];
    if (usedRules.length > 0) {
      await tx
        .update(categorizationRules)
        .set({ hits: sql`${categorizationRules.hits} + 1`, lastUsedAt: new Date() })
        .where(inArray(categorizationRules.id, usedRules));
    }

    await tx
      .update(importBatches)
      .set({ status: 'committed', committedAt: new Date() })
      .where(eq(importBatches.id, batch.id));
    return { created: rows.length, accountId: batch.accountId };
  });
}

export async function discardImportBatch(workspaceId: string, batchId: string) {
  await requireMembership(workspaceId, 'import.run');
  const batch = await findBatch(workspaceId, batchId);
  if (batch.status !== 'review') {
    throw new ImportError('not-in-review', 'Esta importação já foi concluída.');
  }
  await getDb().update(importBatches).set({ status: 'discarded' }).where(eq(importBatches.id, batch.id));
}

export async function listImportBatches(workspaceId: string): Promise<ImportBatchSummary[]> {
  await requireMembership(workspaceId, 'workspace.read');
  const rows = await getDb()
    .select({
      id: importBatches.id,
      fileName: importBatches.fileName,
      status: importBatches.status,
      accountName: accounts.name,
      createdAt: importBatches.createdAt,
      rowCount: count(importRows.id),
    })
    .from(importBatches)
    .innerJoin(accounts, eq(accounts.id, importBatches.accountId))
    .leftJoin(importRows, eq(importRows.batchId, importBatches.id))
    .where(eq(importBatches.workspaceId, workspaceId))
    .groupBy(importBatches.id, accounts.name)
    .orderBy(desc(importBatches.createdAt))
    .limit(20);
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

/**
 * Pede à AI nome limpo e categoria para as linhas incluídas ainda sem categoria.
 * O `enricher` é injetado: em produção vem da Claude API; nos testes, um falso.
 */
export async function suggestImportCategories(
  workspaceId: string,
  batchId: string,
  { enricher, model }: { enricher: Enricher; model: string },
) {
  await requireMembership(workspaceId, 'import.run');
  const batch = await findBatch(workspaceId, batchId);
  if (batch.status !== 'review') {
    throw new ImportError('not-in-review', 'Esta importação já foi concluída.');
  }
  const db = getDb();
  const [rows, allCategories] = await Promise.all([
    db
      .select({ id: importRows.id, description: importRows.rawDescription, amountCents: importRows.amountCents })
      .from(importRows)
      .where(and(eq(importRows.batchId, batch.id), eq(importRows.include, true), isNull(importRows.categoryId))),
    db
      .select({ id: categories.id, name: categories.name, kind: categories.kind, parentId: categories.parentId })
      .from(categories)
      .where(and(eq(categories.workspaceId, workspaceId), isNull(categories.archivedAt))),
  ]);
  if (rows.length === 0) {
    return { suggested: 0 };
  }
  const nameById = new Map(allCategories.map((category) => [category.id, category.name]));
  const { suggestions, usage } = await enricher({
    rows,
    categories: allCategories.map((category) => ({
      id: category.id,
      name: category.name,
      kind: category.kind,
      parentName: category.parentId ? (nameById.get(category.parentId) ?? null) : null,
    })),
  });

  await db.transaction(async (tx) => {
    for (const suggestion of suggestions) {
      await tx
        .update(importRows)
        .set({ description: suggestion.cleanName, categoryId: suggestion.categoryId, aiSuggested: true })
        .where(and(eq(importRows.id, suggestion.id), eq(importRows.batchId, batch.id)));
    }
    if (usage.length > 0) {
      await tx.insert(aiUsageEvents).values(
        usage.map((item) => ({
          workspaceId,
          task: 'enrich',
          model: item.model || model,
          inputTokens: item.inputTokens,
          outputTokens: item.outputTokens,
          importBatchId: batch.id,
        })),
      );
    }
  });
  return { suggested: suggestions.filter((item) => item.categoryId !== null).length };
}
