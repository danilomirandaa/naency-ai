import 'server-only';
import { type BudgetInput, type GoalInput, budgetInputSchema, goalInputSchema } from '@/features/planning/schemas';
import type { BudgetLine, GoalSummary } from '@/features/planning/types';
import type { CategoryIconName } from '@/lib/categories';
import { monthRange, todayIsoDate } from '@/lib/dates';
import { monthlyNeeded } from '@/lib/planning';
import { requireMembership } from '@/server/auth/membership';
import { getDb } from '@/server/db/client';
import { budgets, categories, goals } from '@/server/db/schema';
import { listAccounts } from '@/server/dal/accounts';
import { getCategoryBreakdown } from '@/server/dal/dashboard';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

export class PlanningError extends Error {
  constructor(
    public readonly code: 'not-found' | 'invalid-category' | 'invalid-account',
    message: string,
  ) {
    super(message);
    this.name = 'PlanningError';
  }
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

/** Categorias principais de despesa com orçamento (se houver) e o gasto do mês. */
export async function listBudgets(workspaceId: string, month: string): Promise<BudgetLine[]> {
  await requireMembership(workspaceId, 'workspace.read');
  const db = getDb();
  const [roots, amounts, spending] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, icon: categories.icon, color: categories.color })
      .from(categories)
      .where(
        and(
          eq(categories.workspaceId, workspaceId),
          eq(categories.kind, 'expense'),
          isNull(categories.parentId),
          isNull(categories.archivedAt),
        ),
      ),
    db.select({ categoryId: budgets.categoryId, amountCents: budgets.amountCents }).from(budgets).where(eq(budgets.workspaceId, workspaceId)),
    getCategoryBreakdown(workspaceId, monthRange(month)),
  ]);
  return roots
    .map((root) => ({
      categoryId: root.id,
      name: root.name,
      icon: root.icon as CategoryIconName,
      color: root.color,
      budgetCents: amounts.find((item) => item.categoryId === root.id)?.amountCents ?? null,
      spentCents: spending.find((slice) => slice.categoryId === root.id)?.totalCents ?? 0,
    }))
    .sort((a, b) => Number(b.budgetCents !== null) - Number(a.budgetCents !== null) || collator.compare(a.name, b.name));
}

export async function setBudget(workspaceId: string, input: BudgetInput) {
  await requireMembership(workspaceId, 'finance.write');
  const data = budgetInputSchema.parse(input);
  const db = getDb();
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.id, data.categoryId),
        eq(categories.workspaceId, workspaceId),
        eq(categories.kind, 'expense'),
        isNull(categories.parentId),
      ),
    );
  if (!category) {
    throw new PlanningError('invalid-category', 'Orçamento só em categoria principal de despesa.');
  }
  if (data.amountCents === null) {
    await db.delete(budgets).where(and(eq(budgets.workspaceId, workspaceId), eq(budgets.categoryId, data.categoryId)));
    return;
  }
  await db
    .insert(budgets)
    .values({ workspaceId, categoryId: data.categoryId, amountCents: data.amountCents })
    .onConflictDoUpdate({ target: [budgets.workspaceId, budgets.categoryId], set: { amountCents: data.amountCents } });
}

export async function listGoals(
  workspaceId: string,
  { today = todayIsoDate() }: { today?: string } = {},
): Promise<GoalSummary[]> {
  const accountList = await listAccounts(workspaceId, { includeArchived: true });
  const rows = await getDb().select().from(goals).where(eq(goals.workspaceId, workspaceId));
  return rows
    .flatMap((goal) => {
      const account = accountList.find((item) => item.id === goal.accountId);
      if (!account) {
        return [];
      }
      return [
        {
          id: goal.id,
          name: goal.name,
          targetCents: goal.targetCents,
          targetDate: goal.targetDate,
          account: {
            id: account.id,
            name: account.name,
            type: account.type,
            institution: account.institution ? { name: account.institution.name, color: account.institution.color } : null,
          },
          savedCents: account.balanceCents,
          monthlyNeededCents: monthlyNeeded(goal.targetCents, account.balanceCents, today, goal.targetDate),
        },
      ];
    })
    .sort((a, b) => collator.compare(a.name, b.name));
}

async function assertGoalAccount(workspaceId: string, accountId: string) {
  const accountList = await listAccounts(workspaceId);
  const account = accountList.find((item) => item.id === accountId);
  if (!account || account.type === 'credit_card') {
    throw new PlanningError('invalid-account', 'Escolha uma conta (não cartão) onde o dinheiro da meta fica.');
  }
}

function goalWhere(workspaceId: string, goalId: string) {
  if (!z.uuid().safeParse(goalId).success) {
    throw new PlanningError('not-found', 'Meta não encontrada.');
  }
  return and(eq(goals.id, goalId), eq(goals.workspaceId, workspaceId));
}

export async function createGoal(workspaceId: string, input: GoalInput) {
  await requireMembership(workspaceId, 'finance.write');
  const data = goalInputSchema.parse(input);
  await assertGoalAccount(workspaceId, data.accountId);
  const [goal] = await getDb().insert(goals).values({ ...data, workspaceId }).returning({ id: goals.id });
  return { id: goal?.id ?? '' };
}

export async function updateGoal(workspaceId: string, goalId: string, input: GoalInput) {
  await requireMembership(workspaceId, 'finance.write');
  const data = goalInputSchema.parse(input);
  await assertGoalAccount(workspaceId, data.accountId);
  const [goal] = await getDb().update(goals).set(data).where(goalWhere(workspaceId, goalId)).returning({ id: goals.id });
  if (!goal) {
    throw new PlanningError('not-found', 'Meta não encontrada.');
  }
}

export async function deleteGoal(workspaceId: string, goalId: string) {
  await requireMembership(workspaceId, 'finance.write');
  const [goal] = await getDb().delete(goals).where(goalWhere(workspaceId, goalId)).returning({ id: goals.id });
  if (!goal) {
    throw new PlanningError('not-found', 'Meta não encontrada.');
  }
}
