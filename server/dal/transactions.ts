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
import { monthRange } from '@/lib/dates';
import { signedAmount } from '@/lib/transactions';
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
import { and, count, desc, eq, gte, ilike, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
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
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

const counterpart = alias(transactions, 'counterpart');
const counterpartAccount = alias(accounts, 'counterpart_account');
const parentCategory = alias(categories, 'parent_category');

function filterConditions(workspaceId: string, filters: TransactionFilters) {
  const { from, to } = monthRange(filters.month);
  const search = filters.search.replace(/[%_\\]/g, (char) => `\\${char}`);
  // A fatura junta compras de meses diferentes: com ela, o mês não filtra.
  const byInvoice = Boolean(filters.invoiceId);
  return and(
    eq(transactions.workspaceId, workspaceId),
    isNull(transactions.deletedAt),
    byInvoice ? undefined : gte(transactions.date, from),
    byInvoice ? undefined : lte(transactions.date, to),
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
  const where = filterConditions(workspaceId, filters);

  const rows = await db
    .select({
      id: transactions.id,
      kind: transactions.kind,
      amountCents: transactions.amountCents,
      date: transactions.date,
      description: transactions.description,
      notes: transactions.notes,
      status: transactions.status,
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
    .orderBy(desc(transactions.date), desc(transactions.createdAt), desc(transactions.id))
    .limit(TRANSACTIONS_PAGE_SIZE)
    .offset((filters.page - 1) * TRANSACTIONS_PAGE_SIZE);

  const [summary] = await db
    .select({
      total: count(),
      incomeCents: sql<string>`coalesce(sum(case when ${transactions.kind} = 'income' then ${transactions.amountCents} end), 0)`,
      expenseCents: sql<string>`coalesce(sum(case when ${transactions.kind} = 'expense' then ${transactions.amountCents} end), 0)`,
    })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(where);

  const items: TransactionItem[] = rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    amountCents: row.amountCents,
    date: row.date,
    description: row.description,
    notes: row.notes,
    status: row.status,
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
    total: summary?.total ?? 0,
    page: filters.page,
    pageSize: TRANSACTIONS_PAGE_SIZE,
    totals: {
      incomeCents: Number(summary?.incomeCents ?? 0),
      expenseCents: Number(summary?.expenseCents ?? 0),
    },
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
async function resolveInvoiceId(tx: Tx, workspaceId: string, accountId: string, date: string) {
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

  const [row] = await tx
    .insert(transactions)
    .values({
      ...base,
      kind: input.kind,
      accountId: input.accountId,
      amountCents: signedAmount(input.kind, input.amountCents),
      categoryId: input.categoryId,
      invoiceId: await resolveInvoiceId(tx, workspaceId, input.accountId, input.date),
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

/** Marca como efetivado (entra no saldo) ou previsto. */
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
      .set({ status, updatedBy: user.id })
      .where(inArray(transactions.id, legs.map((leg) => leg.id)));
  });
  return { id: transactionId };
}

/** Soma que entra no saldo de cada conta: efetivados, não excluídos, a partir da data do saldo inicial. */
export function accountMovementSql() {
  return sql<string>`coalesce((
    select sum(t.amount_cents) from ${transactions} t
    where t.account_id = ${sql.raw('"accounts"."id"')}
      and t.deleted_at is null
      and t.status = 'cleared'
      and t.date >= ${sql.raw('"accounts"."initial_balance_date"')}
  ), 0)`;
}
