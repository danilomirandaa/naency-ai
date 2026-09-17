import 'server-only';
import { type RecurringRuleInput, recurringRuleInputSchema } from '@/features/recurring/schemas';
import type { RecurringRuleSummary } from '@/features/recurring/types';
import { type CategoryIconName } from '@/lib/categories';
import { todayIsoDate } from '@/lib/dates';
import { nextOccurrence, occurrencesBetween } from '@/lib/recurrence';
import { requireMembership } from '@/server/auth/membership';
import { getDb } from '@/server/db/client';
import { accounts, categories, institutions, recurringRules, transactions } from '@/server/db/schema';
import { resolveInvoiceId } from '@/server/dal/transactions';
import { and, eq, gte, isNull } from 'drizzle-orm';
import { z } from 'zod';

export class RecurringError extends Error {
  constructor(
    public readonly code: 'not-found' | 'invalid-account' | 'invalid-category',
    message: string,
  ) {
    super(message);
    this.name = 'RecurringError';
  }
}

/** Até quantos dias à frente as ocorrências viram lançamentos previstos. */
export const RECURRING_HORIZON_DAYS = 45;

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

export async function listRecurringRules(
  workspaceId: string,
  { today = todayIsoDate() }: { today?: string } = {},
): Promise<RecurringRuleSummary[]> {
  await requireMembership(workspaceId, 'workspace.read');
  const rows = await getDb()
    .select({
      id: recurringRules.id,
      kind: recurringRules.kind,
      amountCents: recurringRules.amountCents,
      description: recurringRules.description,
      frequency: recurringRules.frequency,
      startDate: recurringRules.startDate,
      endDate: recurringRules.endDate,
      active: recurringRules.active,
      accountId: accounts.id,
      accountName: accounts.name,
      accountType: accounts.type,
      institutionName: institutions.name,
      institutionColor: institutions.color,
      categoryId: categories.id,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(recurringRules)
    .innerJoin(accounts, eq(accounts.id, recurringRules.accountId))
    .leftJoin(institutions, eq(institutions.id, accounts.institutionId))
    .leftJoin(categories, eq(categories.id, recurringRules.categoryId))
    .where(eq(recurringRules.workspaceId, workspaceId));

  return rows
    .map((row) => ({
      id: row.id,
      kind: row.kind,
      amountCents: row.amountCents,
      description: row.description,
      frequency: row.frequency,
      startDate: row.startDate,
      endDate: row.endDate,
      active: row.active,
      nextDate: row.active ? nextOccurrence(row, today) : null,
      account: {
        id: row.accountId,
        name: row.accountName,
        type: row.accountType,
        institution:
          row.institutionName && row.institutionColor ? { name: row.institutionName, color: row.institutionColor } : null,
      },
      category:
        row.categoryId && row.categoryName && row.categoryIcon && row.categoryColor
          ? {
              id: row.categoryId,
              name: row.categoryName,
              icon: row.categoryIcon as CategoryIconName,
              color: row.categoryColor,
            }
          : null,
    }))
    .sort(
      (a, b) =>
        Number(b.active) - Number(a.active) ||
        (a.nextDate ?? '9999').localeCompare(b.nextDate ?? '9999') ||
        collator.compare(a.description, b.description),
    );
}

type Parsed = ReturnType<typeof recurringRuleInputSchema.parse>;

async function assertReferences(workspaceId: string, data: Parsed) {
  const db = getDb();
  const [account] = await db
    .select({ archivedAt: accounts.archivedAt })
    .from(accounts)
    .where(and(eq(accounts.id, data.accountId), eq(accounts.workspaceId, workspaceId)));
  if (!account || account.archivedAt) {
    throw new RecurringError('invalid-account', 'Conta não encontrada ou arquivada.');
  }
  if (data.categoryId) {
    const [category] = await db
      .select({ kind: categories.kind })
      .from(categories)
      .where(and(eq(categories.id, data.categoryId), eq(categories.workspaceId, workspaceId), isNull(categories.archivedAt)));
    if (!category || category.kind !== data.kind) {
      throw new RecurringError('invalid-category', 'Escolha uma categoria do mesmo tipo.');
    }
  }
}

function findRuleWhere(workspaceId: string, ruleId: string) {
  if (!z.uuid().safeParse(ruleId).success) {
    throw new RecurringError('not-found', 'Recorrência não encontrada.');
  }
  return and(eq(recurringRules.id, ruleId), eq(recurringRules.workspaceId, workspaceId));
}

type Tx = Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0];

/** Remove as ocorrências futuras ainda previstas (as efetivadas ficam). */
async function clearFuturePlanned(tx: Tx, ruleId: string, today: string) {
  await tx
    .delete(transactions)
    .where(
      and(
        eq(transactions.recurringRuleId, ruleId),
        eq(transactions.status, 'planned'),
        isNull(transactions.deletedAt),
        gte(transactions.recurrenceDate, today),
      ),
    );
}

export async function createRecurringRule(
  workspaceId: string,
  input: RecurringRuleInput,
  { today = todayIsoDate() }: { today?: string } = {},
) {
  const { user } = await requireMembership(workspaceId, 'finance.write');
  const data = recurringRuleInputSchema.parse(input);
  await assertReferences(workspaceId, data);
  const [rule] = await getDb()
    .insert(recurringRules)
    .values({ ...data, workspaceId, generateFrom: today, createdBy: user.id })
    .returning({ id: recurringRules.id });
  await materializeRecurring(workspaceId, { today });
  return { id: rule?.id ?? '' };
}

export async function updateRecurringRule(
  workspaceId: string,
  ruleId: string,
  input: RecurringRuleInput,
  { today = todayIsoDate() }: { today?: string } = {},
) {
  await requireMembership(workspaceId, 'finance.write');
  const data = recurringRuleInputSchema.parse(input);
  await assertReferences(workspaceId, data);
  await getDb().transaction(async (tx) => {
    const [rule] = await tx
      .update(recurringRules)
      .set(data)
      .where(findRuleWhere(workspaceId, ruleId))
      .returning({ id: recurringRules.id });
    if (!rule) {
      throw new RecurringError('not-found', 'Recorrência não encontrada.');
    }
    await clearFuturePlanned(tx, ruleId, today);
  });
  await materializeRecurring(workspaceId, { today });
}

export async function setRecurringRuleActive(
  workspaceId: string,
  ruleId: string,
  active: boolean,
  { today = todayIsoDate() }: { today?: string } = {},
) {
  await requireMembership(workspaceId, 'finance.write');
  await getDb().transaction(async (tx) => {
    const [rule] = await tx
      .update(recurringRules)
      .set({ active, ...(active ? { generateFrom: today } : {}) })
      .where(findRuleWhere(workspaceId, ruleId))
      .returning({ id: recurringRules.id });
    if (!rule) {
      throw new RecurringError('not-found', 'Recorrência não encontrada.');
    }
    if (!active) {
      await clearFuturePlanned(tx, ruleId, today);
    }
  });
  if (active) {
    await materializeRecurring(workspaceId, { today });
  }
}

export async function deleteRecurringRule(
  workspaceId: string,
  ruleId: string,
  { today = todayIsoDate() }: { today?: string } = {},
) {
  await requireMembership(workspaceId, 'finance.write');
  await getDb().transaction(async (tx) => {
    const where = findRuleWhere(workspaceId, ruleId);
    const [rule] = await tx.select({ id: recurringRules.id }).from(recurringRules).where(where);
    if (!rule) {
      throw new RecurringError('not-found', 'Recorrência não encontrada.');
    }
    await clearFuturePlanned(tx, ruleId, today);
    await tx.delete(recurringRules).where(where);
  });
}

/**
 * Gera os lançamentos previstos das regras ativas até o horizonte. Idempotente:
 * cada data prevista existe uma vez (inclusive excluída), então pode rodar a cada leitura.
 */
export async function materializeRecurring(workspaceId: string, { today = todayIsoDate() }: { today?: string } = {}) {
  await requireMembership(workspaceId, 'workspace.read');
  const horizon = addDays(today, RECURRING_HORIZON_DAYS);
  const db = getDb();
  const rules = await db
    .select()
    .from(recurringRules)
    .where(and(eq(recurringRules.workspaceId, workspaceId), eq(recurringRules.active, true)));
  let created = 0;
  for (const rule of rules) {
    const dates = occurrencesBetween(rule, rule.generateFrom, horizon);
    if (dates.length === 0) {
      continue;
    }
    await db.transaction(async (tx) => {
      for (const date of dates) {
        const inserted = await tx
          .insert(transactions)
          .values({
            workspaceId,
            accountId: rule.accountId,
            kind: rule.kind,
            amountCents: rule.kind === 'income' ? rule.amountCents : -rule.amountCents,
            date,
            description: rule.description,
            categoryId: rule.categoryId,
            status: 'planned',
            recurringRuleId: rule.id,
            recurrenceDate: date,
            invoiceId: await resolveInvoiceId(tx, workspaceId, rule.accountId, date),
            createdBy: rule.createdBy,
            updatedBy: rule.createdBy,
          })
          .onConflictDoNothing({ target: [transactions.recurringRuleId, transactions.recurrenceDate] })
          .returning({ id: transactions.id });
        created += inserted.length;
      }
    });
  }
  return { created };
}
