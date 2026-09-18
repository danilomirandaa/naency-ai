import 'server-only';
import { TRANSACTIONS_PAGE_SIZE, type TransactionFilters } from '@/features/transactions/filters';
import {
  type TransactionInput,
  type TransactionInputRaw,
  transactionInputSchema,
} from '@/features/transactions/schemas';
import type { TransactionItem, TransactionsPage } from '@/features/transactions/types';
import type { CategoryIconName } from '@/lib/categories';
import { addMonthsToDate, invoiceForPurchase, splitInstallments } from '@/lib/cards';
import { todayIsoDate } from '@/lib/dates';
import { type TransactionStatus, signedAmount } from '@/lib/transactions';
import { requireMembership } from '@/server/auth/membership';
import { getDb } from '@/server/db/client';
import {
  accounts,
  cardInvoices,
  categories,
  creditCardDetails,
  installmentGroups,
  institutions,
  profiles,
  transactions,
} from '@/server/db/schema';
import { type SQL, and, asc, count, desc, eq, gte, ilike, inArray, isNull, lt, lte, ne, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export class TransactionError extends Error {
  constructor(
    public readonly code: 'not-found' | 'invalid-account' | 'invalid-category' | 'installments-require-card',
    message: string,
    public readonly field?: 'accountId' | 'toAccountId' | 'categoryId' | 'installments',
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

type Db = ReturnType<typeof getDb>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

const counterpart = alias(transactions, 'counterpart');
const counterpartAccount = alias(accounts, 'counterpart_account');
const parentCategory = alias(categories, 'parent_category');

/** Efetivado guarda o dia do pagamento (padrão: a data do lançamento); previsto, nenhum. */
function paidAtFor(status: TransactionStatus, paidAt: string | null, date: string) {
  return status === 'cleared' ? (paidAt ?? date) : null;
}

function filterConditions(workspaceId: string, filters: TransactionFilters, today: string) {
  const { from, to } = filters;
  const search = filters.search.replace(/[%_\\]/g, (char) => `\\${char}`);
  // A fatura junta compras de meses diferentes, e atrasadas vêm de qualquer mês: nos dois casos o período não filtra.
  const ignorePeriod = Boolean(filters.invoiceId) || filters.situation === 'overdue';
  return and(
    eq(transactions.workspaceId, workspaceId),
    isNull(transactions.deletedAt),
    ignorePeriod ? undefined : gte(transactions.date, from),
    ignorePeriod ? undefined : lte(transactions.date, to),
    filters.situation === 'overdue'
      ? and(eq(transactions.status, 'planned'), lt(transactions.date, today))
      : filters.situation === 'pending'
        ? eq(transactions.status, 'planned')
        : filters.situation === 'paid'
          ? eq(transactions.status, 'cleared')
          : undefined,
    // Sem filtro de conta, a transferência aparece uma vez (pela perna de saída).
    filters.accountId
      ? eq(transactions.accountId, filters.accountId)
      : or(ne(transactions.kind, 'transfer'), lte(transactions.amountCents, 0)),
    filters.kind ? eq(transactions.kind, filters.kind) : undefined,
    filters.categoryId
      ? or(eq(transactions.categoryId, filters.categoryId), eq(categories.parentId, filters.categoryId))
      : undefined,
    search ? ilike(transactions.description, `%${search}%`) : undefined,
    filters.invoiceId ? eq(transactions.invoiceId, filters.invoiceId) : undefined,
  );
}

export async function listTransactions(
  workspaceId: string,
  filters: TransactionFilters,
): Promise<TransactionsPage> {
  await requireMembership(workspaceId, 'workspace.read');
  const db = getDb();
  const today = todayIsoDate();
  const where = filterConditions(workspaceId, filters, today);
  const dir = filters.sort?.dir === 'asc' ? asc : desc;
  const sortColumns: Record<NonNullable<TransactionFilters['sort']>['key'], SQL> = {
    date: sql`${transactions.date}`,
    amount: sql`abs(${transactions.amountCents})`,
    description: sql`lower(${transactions.description})`,
    account: sql`lower(${accounts.name})`,
    category: sql`lower(${categories.name})`,
    paidAt: sql`${transactions.paidAt}`,
  };
  const byOtherColumn = filters.sort && filters.sort.key !== 'date';
  // Dentro do dia, a hora do extrato manda (quem não tem hora vai depois);
  // o empate final é a ordem em que entrou no sistema.
  const withinDay = byOtherColumn
    ? [sql`${desc(transactions.occurredTime)} nulls last`]
    : [sql`${dir(transactions.occurredTime)} nulls last`];
  const orderBy = [
    ...(byOtherColumn && filters.sort ? [sql`${dir(sortColumns[filters.sort.key])} nulls last`] : []),
    // Empate (ou ordem por data): a data na direção pedida; em outra coluna, mais recentes primeiro.
    byOtherColumn ? desc(transactions.date) : dir(transactions.date),
    ...withinDay,
    desc(transactions.createdAt),
    desc(transactions.id),
  ];

  const rows = await db
    .select({
      id: transactions.id,
      kind: transactions.kind,
      amountCents: transactions.amountCents,
      date: transactions.date,
      occurredTime: transactions.occurredTime,
      description: transactions.description,
      notes: transactions.notes,
      status: transactions.status,
      paymentMethod: transactions.paymentMethod,
      paidAt: transactions.paidAt,
      recurringRuleId: transactions.recurringRuleId,
      accountId: accounts.id,
      accountName: accounts.name,
      accountType: accounts.type,
      institutionName: institutions.name,
      institutionColor: institutions.color,
      categoryId: categories.id,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      parentCategoryName: parentCategory.name,
      counterpartAccountId: counterpartAccount.id,
      counterpartAccountName: counterpartAccount.name,
      createdByName: profiles.name,
      installmentNumber: transactions.installmentNumber,
      installmentTotal: transactions.installmentTotal,
      invoiceMonth: cardInvoices.referenceMonth,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .leftJoin(institutions, eq(institutions.id, accounts.institutionId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .leftJoin(parentCategory, eq(parentCategory.id, categories.parentId))
    .leftJoin(
      counterpart,
      and(
        eq(counterpart.transferGroupId, transactions.transferGroupId),
        ne(counterpart.id, transactions.id),
        isNull(counterpart.deletedAt),
      ),
    )
    .leftJoin(counterpartAccount, eq(counterpartAccount.id, counterpart.accountId))
    .innerJoin(profiles, eq(profiles.id, transactions.createdBy))
    .leftJoin(cardInvoices, eq(cardInvoices.id, transactions.invoiceId))
    .where(where)
    .orderBy(...orderBy)
    .limit(TRANSACTIONS_PAGE_SIZE)
    .offset((filters.page - 1) * TRANSACTIONS_PAGE_SIZE);

  const [{ total } = { total: 0 }] = await db
    .select({ total: count() })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(where);

  // Os cartões de resumo mostram o período inteiro, qualquer que seja a situação escolhida.
  const moving = sql`${transactions.kind} <> 'transfer'`;
  const [summary] = await db
    .select({
      incomeCents: sql<string>`coalesce(sum(case when ${transactions.kind} = 'income' then ${transactions.amountCents} end), 0)`,
      expenseCents: sql<string>`coalesce(sum(case when ${transactions.kind} = 'expense' then ${transactions.amountCents} end), 0)`,
      pendingCents: sql<string>`coalesce(sum(case when ${moving} and ${transactions.status} = 'planned' then ${transactions.amountCents} end), 0)`,
      pendingCount: sql<number>`count(*) filter (where ${moving} and ${transactions.status} = 'planned')::int`,
      paidCents: sql<string>`coalesce(sum(case when ${moving} and ${transactions.status} = 'cleared' then ${transactions.amountCents} end), 0)`,
      paidCount: sql<number>`count(*) filter (where ${moving} and ${transactions.status} = 'cleared')::int`,
    })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(filterConditions(workspaceId, { ...filters, situation: null }, today));

  const [overdue] = await db
    .select({ count: count() })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(filterConditions(workspaceId, { ...filters, situation: 'overdue' }, today));

  const items: TransactionItem[] = rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    amountCents: row.amountCents,
    date: row.date,
    occurredTime: row.occurredTime,
    description: row.description,
    notes: row.notes,
    status: row.status,
    paymentMethod: row.paymentMethod,
    paidAt: row.status === 'cleared' ? (row.paidAt ?? row.date) : null,
    recurring: row.recurringRuleId !== null,
    account: {
      id: row.accountId,
      name: row.accountName,
      type: row.accountType,
      institution:
        row.institutionName && row.institutionColor
          ? { name: row.institutionName, color: row.institutionColor }
          : null,
    },
    category:
      row.categoryId && row.categoryName && row.categoryIcon && row.categoryColor
        ? {
            id: row.categoryId,
            name: row.categoryName,
            icon: row.categoryIcon as CategoryIconName,
            color: row.categoryColor,
            parentName: row.parentCategoryName,
          }
        : null,
    transfer:
      row.kind === 'transfer' && row.counterpartAccountId && row.counterpartAccountName
        ? {
            counterpartAccountId: row.counterpartAccountId,
            counterpartAccountName: row.counterpartAccountName,
          }
        : null,
    createdByName: row.createdByName,
    installment:
      row.installmentNumber !== null && row.installmentTotal !== null
        ? { number: row.installmentNumber, total: row.installmentTotal }
        : null,
    invoiceMonth: row.invoiceMonth,
  }));

  return {
    items,
    total,
    page: filters.page,
    pageSize: TRANSACTIONS_PAGE_SIZE,
    totals: {
      incomeCents: Number(summary?.incomeCents ?? 0),
      expenseCents: Number(summary?.expenseCents ?? 0),
      pending: { cents: Number(summary?.pendingCents ?? 0), count: Number(summary?.pendingCount ?? 0) },
      paid: { cents: Number(summary?.paidCents ?? 0), count: Number(summary?.paidCount ?? 0) },
    },
    overdueCount: overdue?.count ?? 0,
  };
}

function assertUuid(id: string) {
  if (!z.uuid().safeParse(id).success) {
    throw new TransactionError('not-found', 'Lançamento não encontrado.');
  }
}

/** Contas do espaço; arquivada só é aceita se já era a conta do lançamento. */
async function assertAccounts(
  tx: Tx,
  workspaceId: string,
  ids: { field: 'accountId' | 'toAccountId'; id: string }[],
  alreadyUsed: string[],
) {
  const found = await tx
    .select({ id: accounts.id, archivedAt: accounts.archivedAt })
    .from(accounts)
    .where(and(eq(accounts.workspaceId, workspaceId), inArray(accounts.id, ids.map((item) => item.id))));
  for (const { field, id } of ids) {
    const account = found.find((item) => item.id === id);
    if (!account || (account.archivedAt && !alreadyUsed.includes(id))) {
      throw new TransactionError('invalid-account', 'Conta não encontrada ou arquivada.', field);
    }
  }
}

async function assertCategory(
  tx: Tx,
  workspaceId: string,
  input: TransactionInput,
  alreadyUsed: string | null,
) {
  if (input.kind === 'transfer' || !input.categoryId) {
    return;
  }
  const [category] = await tx
    .select({ kind: categories.kind, archivedAt: categories.archivedAt })
    .from(categories)
    .where(and(eq(categories.id, input.categoryId), eq(categories.workspaceId, workspaceId)));
  if (
    !category ||
    category.kind !== input.kind ||
    (category.archivedAt && alreadyUsed !== input.categoryId)
  ) {
    throw new TransactionError('invalid-category', 'Escolha uma categoria do mesmo tipo.', 'categoryId');
  }
}

/** Fatura do cartão para a data; cria a fatura se ainda não existir. `null` se não for cartão. */
export async function resolveInvoiceId(tx: Tx, workspaceId: string, accountId: string, date: string) {
  const [card] = await tx
    .select({ closingDay: creditCardDetails.closingDay, dueDay: creditCardDetails.dueDay })
    .from(creditCardDetails)
    .where(eq(creditCardDetails.accountId, accountId));
  if (!card) {
    return null;
  }
  const period = invoiceForPurchase(date, card.closingDay, card.dueDay);
  await tx
    .insert(cardInvoices)
    .values({ workspaceId, accountId, ...period })
    .onConflictDoNothing({ target: [cardInvoices.accountId, cardInvoices.referenceMonth] });
  const [invoice] = await tx
    .select({ id: cardInvoices.id })
    .from(cardInvoices)
    .where(and(eq(cardInvoices.accountId, accountId), eq(cardInvoices.referenceMonth, period.referenceMonth)));
  return invoice?.id ?? null;
}

async function insertTransaction(tx: Tx, workspaceId: string, userId: string, input: TransactionInput) {
  const base = {
    workspaceId,
    date: input.date,
    description: input.description,
    status: input.status,
    paidAt: paidAtFor(input.status, input.paidAt, input.date),
    paymentMethod: input.paymentMethod,
    notes: input.notes,
    createdBy: userId,
    updatedBy: userId,
  };
  if (input.kind === 'transfer') {
    const transferGroupId = crypto.randomUUID();
    const [outgoing] = await tx
      .insert(transactions)
      .values([
        { ...base, kind: 'transfer', transferGroupId, accountId: input.accountId, amountCents: -input.amountCents },
        { ...base, kind: 'transfer', transferGroupId, accountId: input.toAccountId, amountCents: input.amountCents },
      ])
      .returning({ id: transactions.id });
    return { id: outgoing?.id ?? '' };
  }

  if (input.installments > 1) {
    return insertInstallments(tx, workspaceId, userId, input);
  }

  const invoiceId = await resolveInvoiceId(tx, workspaceId, input.accountId, input.date);
  const [row] = await tx
    .insert(transactions)
    .values({
      ...base,
      kind: input.kind,
      accountId: input.accountId,
      amountCents: signedAmount(input.kind, input.amountCents),
      categoryId: input.categoryId,
      invoiceId,
      // Lançamento em conta cartão foi pago com o cartão, a menos que digam outra coisa.
      paymentMethod: input.paymentMethod ?? (invoiceId ? 'credit_card' : null),
    })
    .returning({ id: transactions.id });
  return { id: row?.id ?? '' };
}

/** Compra parcelada no cartão: uma despesa por mês, cada uma na sua fatura. */
async function insertInstallments(
  tx: Tx,
  workspaceId: string,
  userId: string,
  input: Extract<TransactionInput, { kind: 'expense' | 'income' }>,
) {
  const [card] = await tx
    .select({ accountId: creditCardDetails.accountId })
    .from(creditCardDetails)
    .where(eq(creditCardDetails.accountId, input.accountId));
  if (!card || input.kind !== 'expense') {
    throw new TransactionError(
      'installments-require-card',
      'Parcelamento só em despesa de cartão de crédito.',
      'installments',
    );
  }
  const [group] = await tx
    .insert(installmentGroups)
    .values({
      workspaceId,
      accountId: input.accountId,
      description: input.description,
      totalAmountCents: input.amountCents,
      installmentsCount: input.installments,
      firstDate: input.date,
      categoryId: input.categoryId,
      createdBy: userId,
    })
    .returning({ id: installmentGroups.id });
  const amounts = splitInstallments(input.amountCents, input.installments);
  let firstId = '';
  for (const [index, amount] of amounts.entries()) {
    const date = addMonthsToDate(input.date, index);
    const [row] = await tx
      .insert(transactions)
      .values({
        workspaceId,
        kind: 'expense',
        accountId: input.accountId,
        amountCents: -amount,
        date,
        description: `${input.description} (${index + 1}/${input.installments})`,
        categoryId: input.categoryId,
        status: input.status,
        paidAt: paidAtFor(input.status, input.paidAt, date),
        paymentMethod: input.paymentMethod ?? 'credit_card',
        notes: input.notes,
        installmentGroupId: group?.id,
        installmentNumber: index + 1,
        installmentTotal: input.installments,
        invoiceId: await resolveInvoiceId(tx, workspaceId, input.accountId, date),
        createdBy: userId,
        updatedBy: userId,
      })
      .returning({ id: transactions.id });
    firstId ||= row?.id ?? '';
  }
  return { id: firstId };
}

export async function createTransaction(workspaceId: string, input: TransactionInputRaw) {
  const { user } = await requireMembership(workspaceId, 'finance.write');
  const data = transactionInputSchema.parse(input);
  return getDb().transaction(async (tx) => {
    await assertAccounts(
      tx,
      workspaceId,
      [
        { field: 'accountId', id: data.accountId },
        ...(data.kind === 'transfer' ? [{ field: 'toAccountId' as const, id: data.toAccountId }] : []),
      ],
      [],
    );
    await assertCategory(tx, workspaceId, data, null);
    return insertTransaction(tx, workspaceId, user.id, data);
  });
}

/** Linhas vivas do lançamento: uma, ou as duas pernas da transferência. */
async function loadLegs(tx: Tx, workspaceId: string, transactionId: string) {
  assertUuid(transactionId);
  const [row] = await tx
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.workspaceId, workspaceId),
        isNull(transactions.deletedAt),
      ),
    );
  if (!row) {
    throw new TransactionError('not-found', 'Lançamento não encontrado.');
  }
  if (!row.transferGroupId) {
    return [row];
  }
  return tx
    .select()
    .from(transactions)
    .where(and(eq(transactions.transferGroupId, row.transferGroupId), isNull(transactions.deletedAt)));
}

export async function updateTransaction(
  workspaceId: string,
  transactionId: string,
  input: TransactionInputRaw,
) {
  const { user } = await requireMembership(workspaceId, 'finance.write');
  const parsed = transactionInputSchema.parse(input);
  // Editar muda só este lançamento; parcelar é na criação.
  const data = parsed.kind === 'transfer' ? parsed : { ...parsed, installments: 1 };
  return getDb().transaction(async (tx) => {
    const legs = await loadLegs(tx, workspaceId, transactionId);
    const used = legs.map((leg) => leg.accountId);
    await assertAccounts(
      tx,
      workspaceId,
      [
        { field: 'accountId', id: data.accountId },
        ...(data.kind === 'transfer' ? [{ field: 'toAccountId' as const, id: data.toAccountId }] : []),
      ],
      used,
    );
    await assertCategory(tx, workspaceId, data, legs[0]?.categoryId ?? null);

    const wasTransfer = legs[0]?.kind === 'transfer';
    const common = {
      date: data.date,
      description: data.description,
      status: data.status,
      paidAt: paidAtFor(data.status, data.paidAt, data.date),
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      updatedBy: user.id,
    };

    if (!wasTransfer && data.kind !== 'transfer') {
      await tx
        .update(transactions)
        .set({
          ...common,
          kind: data.kind,
          accountId: data.accountId,
          amountCents: signedAmount(data.kind, data.amountCents),
          categoryId: data.categoryId,
          invoiceId: await resolveInvoiceId(tx, workspaceId, data.accountId, data.date),
        })
        .where(eq(transactions.id, transactionId));
      return { id: transactionId };
    }

    if (wasTransfer && data.kind === 'transfer') {
      const outgoing = legs.find((leg) => leg.amountCents < 0);
      const incoming = legs.find((leg) => leg.amountCents > 0);
      if (outgoing) {
        await tx
          .update(transactions)
          .set({ ...common, accountId: data.accountId, amountCents: -data.amountCents })
          .where(eq(transactions.id, outgoing.id));
      }
      if (incoming) {
        await tx
          .update(transactions)
          .set({ ...common, accountId: data.toAccountId, amountCents: data.amountCents })
          .where(eq(transactions.id, incoming.id));
      }
      return { id: outgoing?.id ?? transactionId };
    }

    // Mudou entre transferência e receita/despesa: troca as linhas numa transação só.
    await tx
      .update(transactions)
      .set({ deletedAt: new Date(), updatedBy: user.id })
      .where(inArray(transactions.id, legs.map((leg) => leg.id)));
    return insertTransaction(tx, workspaceId, user.id, data);
  });
}

/** Exclusão lógica; na transferência, as duas pernas; na compra parcelada, todas as parcelas. */
export async function deleteTransaction(workspaceId: string, transactionId: string) {
  const { user } = await requireMembership(workspaceId, 'finance.write');
  await getDb().transaction(async (tx) => {
    const legs = await loadLegs(tx, workspaceId, transactionId);
    const groupId = legs[0]?.installmentGroupId;
    await tx
      .update(transactions)
      .set({ deletedAt: new Date(), updatedBy: user.id })
      .where(
        groupId
          ? and(eq(transactions.installmentGroupId, groupId), isNull(transactions.deletedAt))
          : inArray(transactions.id, legs.map((leg) => leg.id)),
      );
  });
  return { id: transactionId };
}

/** Marca como efetivado (entra no saldo, pago hoje) ou previsto. */
export async function setTransactionStatus(
  workspaceId: string,
  transactionId: string,
  status: 'cleared' | 'planned',
) {
  const { user } = await requireMembership(workspaceId, 'finance.write');
  await getDb().transaction(async (tx) => {
    const legs = await loadLegs(tx, workspaceId, transactionId);
    await tx
      .update(transactions)
      .set({ status, paidAt: status === 'cleared' ? todayIsoDate() : null, updatedBy: user.id })
      .where(inArray(transactions.id, legs.map((leg) => leg.id)));
  });
  return { id: transactionId };
}

/**
 * Soma que entra no saldo de cada conta: efetivados e não excluídos, **depois** do
 * dia do saldo informado. O saldo que o banco mostra é o do fim do dia, então os
 * lançamentos daquele mesmo dia já estão nele; contá-los de novo dobrava o valor.
 * Cartão sem dívida declarada (saldo inicial zero) soma tudo: a fatura importada
 * costuma ser mais antiga que o cadastro do cartão, e sem isso o limite usado
 * ficaria zerado.
 */
export function accountMovementSql() {
  const type = sql.raw('"accounts"."type"');
  const initialCents = sql.raw('"accounts"."initial_balance_cents"');
  const initialDate = sql.raw('"accounts"."initial_balance_date"');
  return sql<string>`coalesce((
    select sum(t.amount_cents) from ${transactions} t
    where t.account_id = ${sql.raw('"accounts"."id"')}
      and t.deleted_at is null
      and t.status = 'cleared'
      and ((${type} = 'credit_card' and ${initialCents} = 0) or t.date > ${initialDate})
  ), 0)`;
}
