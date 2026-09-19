import 'server-only';
import type {
  BalanceData,
  CashflowPoint,
  CategorySlice,
  EvolutionPoint,
  MonthResultData,
  MonthTotals,
  RecentTransaction,
  SetupProgress,
  UpcomingItem,
} from '@/features/dashboard/types';
import { type CategoryIconName, buildCategoryTree } from '@/lib/categories';
import { monthRange, shiftMonth, todayIsoDate } from '@/lib/dates';
import { type DateRange, previousRange } from '@/lib/periods';
import { requireMembership } from '@/server/auth/membership';
import { getDb } from '@/server/db/client';
import { accounts, categories, profiles, transactions, workspaceMembers } from '@/server/db/schema';
import { listAccounts } from '@/server/dal/accounts';
import { listCardInvoices } from '@/server/dal/cards';
import { and, count, desc, eq, gte, isNull, lte, ne, sql } from 'drizzle-orm';

/** Realizado: efetivado, não excluído, sem transferência (docs/dashboard.md). */
function realized(workspaceId: string, from: string, to: string) {
  return and(
    eq(transactions.workspaceId, workspaceId),
    isNull(transactions.deletedAt),
    eq(transactions.status, 'cleared'),
    ne(transactions.kind, 'transfer'),
    gte(transactions.date, from),
    lte(transactions.date, to),
  );
}

async function totalsBetween(workspaceId: string, from: string, to: string): Promise<MonthTotals> {
  const [row] = await getDb()
    .select({
      incomeCents: sql<string>`coalesce(sum(case when ${transactions.kind} = 'income' then ${transactions.amountCents} end), 0)`,
      expenseCents: sql<string>`coalesce(sum(case when ${transactions.kind} = 'expense' then ${transactions.amountCents} end), 0)`,
    })
    .from(transactions)
    .where(realized(workspaceId, from, to));
  return { incomeCents: Number(row?.incomeCents ?? 0), expenseCents: Number(row?.expenseCents ?? 0) };
}

/** Receitas e despesas do período e do anterior de mesmo tamanho. */
export async function getPeriodResult(workspaceId: string, range: DateRange): Promise<MonthResultData> {
  await requireMembership(workspaceId, 'workspace.read');
  const current = range;
  const previous = previousRange(range);
  const [currentTotals, previousTotals] = await Promise.all([
    totalsBetween(workspaceId, current.from, current.to),
    totalsBetween(workspaceId, previous.from, previous.to),
  ]);
  return { range: current, previousRange: previous, current: currentTotals, previous: previousTotals };
}

/** Despesas do mês por categoria principal (subcategorias somadas no pai), da maior para a menor. */
export async function getCategoryBreakdown(workspaceId: string, range: DateRange): Promise<CategorySlice[]> {
  await requireMembership(workspaceId, 'workspace.read');
  const { from, to } = range;
  const db = getDb();
  const [sums, allCategories] = await Promise.all([
    db
      .select({
        categoryId: transactions.categoryId,
        totalCents: sql<string>`sum(-${transactions.amountCents})`,
      })
      .from(transactions)
      .where(and(realized(workspaceId, from, to), eq(transactions.kind, 'expense')))
      .groupBy(transactions.categoryId),
    db
      .select({
        id: categories.id,
        parentId: categories.parentId,
        name: categories.name,
        icon: categories.icon,
        color: categories.color,
      })
      .from(categories)
      .where(and(eq(categories.workspaceId, workspaceId), eq(categories.kind, 'expense'))),
  ]);

  const totalOf = (id: string | null) => Number(sums.find((sum) => sum.categoryId === id)?.totalCents ?? 0);
  const slices: CategorySlice[] = buildCategoryTree(allCategories).map((root) => {
    const children = root.children
      .map((child) => ({ categoryId: child.id, name: child.name, totalCents: totalOf(child.id) }))
      .filter((child) => child.totalCents > 0)
      .sort((a, b) => b.totalCents - a.totalCents);
    return {
      categoryId: root.id,
      name: root.name,
      icon: root.icon as CategoryIconName,
      color: root.color,
      totalCents: totalOf(root.id) + children.reduce((sum, child) => sum + child.totalCents, 0),
      children,
    };
  });
  const uncategorized = totalOf(null);
  if (uncategorized > 0) {
    slices.push({ categoryId: null, name: 'Sem categoria', icon: null, color: null, totalCents: uncategorized, children: [] });
  }
  return slices.filter((slice) => slice.totalCents > 0).sort((a, b) => b.totalCents - a.totalCents);
}

/** Receitas e despesas dos últimos N meses, terminando no mês escolhido. */
export async function getMonthlyEvolution(workspaceId: string, month: string, months = 6): Promise<EvolutionPoint[]> {
  await requireMembership(workspaceId, 'workspace.read');
  const first = shiftMonth(month, -(months - 1));
  const rows = await getDb()
    .select({
      month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
      incomeCents: sql<string>`coalesce(sum(case when ${transactions.kind} = 'income' then ${transactions.amountCents} end), 0)`,
      expenseCents: sql<string>`coalesce(sum(case when ${transactions.kind} = 'expense' then ${transactions.amountCents} end), 0)`,
    })
    .from(transactions)
    .where(realized(workspaceId, monthRange(first).from, monthRange(month).to))
    .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`);
  return Array.from({ length: months }, (_, index) => {
    const current = shiftMonth(first, index);
    const row = rows.find((item) => item.month === current);
    return { month: current, incomeCents: Number(row?.incomeCents ?? 0), expenseCents: Number(row?.expenseCents ?? 0) };
  });
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** Um ponto por dia mesmo sem movimento: a curva do acumulado não pode ter buraco. */
const CASHFLOW_MAX_POINTS = 400;

/**
 * Dia a dia do período: o que entrou, o que saiu e quanto sobrou até ali.
 * A linha acumulada começa em zero no primeiro dia do período — ela responde
 * "o período está no azul?", não "quanto tenho na conta" (isso é o saldo).
 */
export async function getCashflow(workspaceId: string, range: DateRange): Promise<CashflowPoint[]> {
  await requireMembership(workspaceId, 'workspace.read');
  const rows = await getDb()
    .select({
      date: transactions.date,
      incomeCents: sql<string>`coalesce(sum(case when ${transactions.kind} = 'income' then ${transactions.amountCents} end), 0)`,
      expenseCents: sql<string>`coalesce(sum(case when ${transactions.kind} = 'expense' then ${transactions.amountCents} end), 0)`,
    })
    .from(transactions)
    .where(realized(workspaceId, range.from, range.to))
    .groupBy(transactions.date);

  const byDate = new Map(rows.map((row) => [row.date, row]));
  const points: CashflowPoint[] = [];
  let cumulative = 0;
  for (let date = range.from; date <= range.to && points.length < CASHFLOW_MAX_POINTS; date = addDays(date, 1)) {
    const row = byDate.get(date);
    const incomeCents = Number(row?.incomeCents ?? 0);
    const expenseCents = Number(row?.expenseCents ?? 0);
    cumulative += incomeCents + expenseCents;
    points.push({ date, incomeCents, expenseCents, cumulativeCents: cumulative });
  }
  return points;
}

/** Contas previstas (atrasadas e dos próximos dias) e faturas a vencer, por data. */
export async function getUpcoming(
  workspaceId: string,
  { today = todayIsoDate(), days = 30 }: { today?: string; days?: number } = {},
): Promise<UpcomingItem[]> {
  await requireMembership(workspaceId, 'workspace.read');
  const until = addDays(today, days);
  const planned = await getDb()
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      amountCents: transactions.amountCents,
      accountName: accounts.name,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .where(
      and(
        eq(transactions.workspaceId, workspaceId),
        isNull(transactions.deletedAt),
        eq(transactions.status, 'planned'),
        lte(transactions.date, until),
        // Na transferência prevista, só a perna de saída.
        sql`(${transactions.kind} <> 'transfer' or ${transactions.amountCents} < 0)`,
      ),
    )
    .orderBy(transactions.date)
    .limit(50);

  const cards = (await listAccounts(workspaceId)).filter((account) => account.card);
  const invoices = (
    await Promise.all(cards.map((card) => listCardInvoices(workspaceId, card.id, { today })))
  ).flatMap((list, index) =>
    list
      .filter(
        (invoice) =>
          invoice.id !== null && invoice.status !== 'paid' && invoice.totalCents < 0 && invoice.dueDate <= until,
      )
      .map((invoice) => ({
        type: 'invoice' as const,
        id: invoice.id as string,
        date: invoice.dueDate,
        description: `Fatura ${cards[index]?.name ?? ''}`,
        amountCents: invoice.totalCents,
        accountId: cards[index]?.id ?? '',
        referenceMonth: invoice.referenceMonth,
      })),
  );

  return [...planned.map((item) => ({ type: 'transaction' as const, ...item })), ...invoices].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export async function getBalances(workspaceId: string): Promise<BalanceData> {
  const list = await listAccounts(workspaceId);
  const nonCard = list.filter((account) => account.type !== 'credit_card');
  return {
    availableCents: nonCard.reduce((sum, account) => sum + account.balanceCents, 0),
    cardsCents: list.filter((account) => account.type === 'credit_card').reduce((sum, account) => sum + account.balanceCents, 0),
    accounts: list.map(({ id, name, type, institution, balanceCents }) => ({
      id,
      name,
      type,
      institution: institution ? { name: institution.name, color: institution.color } : null,
      balanceCents,
    })),
  };
}

/** Últimos lançados (por criação), com quem lançou. */
export async function getRecentTransactions(workspaceId: string, limit = 8): Promise<RecentTransaction[]> {
  await requireMembership(workspaceId, 'workspace.read');
  return getDb()
    .select({
      id: transactions.id,
      kind: transactions.kind,
      date: transactions.date,
      description: transactions.description,
      amountCents: transactions.amountCents,
      accountName: accounts.name,
      createdByName: profiles.name,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .innerJoin(profiles, eq(profiles.id, transactions.createdBy))
    .where(
      and(
        eq(transactions.workspaceId, workspaceId),
        isNull(transactions.deletedAt),
        sql`(${transactions.kind} <> 'transfer' or ${transactions.amountCents} < 0)`,
      ),
    )
    .orderBy(desc(transactions.createdAt), desc(transactions.id))
    .limit(limit);
}

/** Passos da configuração inicial que ainda faltam. */
export async function getSetupProgress(workspaceId: string): Promise<SetupProgress> {
  await requireMembership(workspaceId, 'workspace.read');
  const db = getDb();
  const [[accountCount], [transactionCount], [memberCount]] = await Promise.all([
    db.select({ value: count() }).from(accounts).where(eq(accounts.workspaceId, workspaceId)),
    db
      .select({ value: count() })
      .from(transactions)
      .where(and(eq(transactions.workspaceId, workspaceId), isNull(transactions.deletedAt))),
    db.select({ value: count() }).from(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId)),
  ]);
  return {
    hasAccount: (accountCount?.value ?? 0) > 0,
    hasTransaction: (transactionCount?.value ?? 0) > 0,
    hasOtherMember: (memberCount?.value ?? 0) > 1,
  };
}
