import 'server-only';
import { type PayInvoiceInput, payInvoiceSchema } from '@/features/cards/schemas';
import type { CardSummary, InvoiceSummary } from '@/features/cards/types';
import { formatMonth, todayIsoDate } from '@/lib/dates';
import { invoiceForPurchase, invoiceStatus } from '@/lib/cards';
import { requireMembership } from '@/server/auth/membership';
import { getDb } from '@/server/db/client';
import { cardInvoices, transactions } from '@/server/db/schema';
import { listAccounts } from '@/server/dal/accounts';
import { and, desc, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import { z } from 'zod';

export class CardError extends Error {
  constructor(
    public readonly code: 'not-found' | 'invalid-account' | 'already-paid' | 'not-paid',
    message: string,
  ) {
    super(message);
    this.name = 'CardError';
  }
}

/**
 * Total da fatura: compras e estornos, sem o pagamento (transferência). A coluna
 * externa vai qualificada à mão: em consulta de uma tabela só, o Drizzle omite o
 * nome da tabela e `"id"` passaria a apontar para o lançamento.
 */
function invoiceTotalSql() {
  return sql<string>`coalesce((
    select sum(t.amount_cents) from ${transactions} t
    where t.invoice_id = ${sql.raw('"card_invoices"."id"')}
      and t.deleted_at is null
      and t.kind <> 'transfer'
  ), 0)`;
}

type InvoiceRow = {
  id: string;
  referenceMonth: string;
  closingDate: string;
  dueDate: string;
  paidAt: Date | null;
  totalCents: string;
};

function toInvoiceSummary(row: InvoiceRow, today: string): InvoiceSummary {
  return {
    id: row.id,
    referenceMonth: row.referenceMonth,
    closingDate: row.closingDate,
    dueDate: row.dueDate,
    totalCents: Number(row.totalCents),
    status: invoiceStatus(row, today),
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
  };
}

async function selectInvoices(workspaceId: string, accountIds: string[]) {
  if (accountIds.length === 0) {
    return [];
  }
  return getDb()
    .select({
      id: cardInvoices.id,
      accountId: cardInvoices.accountId,
      referenceMonth: cardInvoices.referenceMonth,
      closingDate: cardInvoices.closingDate,
      dueDate: cardInvoices.dueDate,
      paidAt: cardInvoices.paidAt,
      totalCents: invoiceTotalSql(),
    })
    .from(cardInvoices)
    .where(and(eq(cardInvoices.workspaceId, workspaceId), inArray(cardInvoices.accountId, accountIds)))
    .orderBy(desc(cardInvoices.referenceMonth));
}

export async function listCards(
  workspaceId: string,
  { includeArchived = false, today = todayIsoDate() }: { includeArchived?: boolean; today?: string } = {},
): Promise<CardSummary[]> {
  const accounts = (await listAccounts(workspaceId, { includeArchived })).filter(
    (account) => account.card !== null,
  );
  const invoices = await selectInvoices(
    workspaceId,
    accounts.map((account) => account.id),
  );

  return accounts.map((account) => {
    const card = account.card as NonNullable<typeof account.card>;
    const period = invoiceForPurchase(today, card.closingDay, card.dueDay);
    const existing = invoices.find(
      (invoice) => invoice.accountId === account.id && invoice.referenceMonth === period.referenceMonth,
    );
    return {
      id: account.id,
      name: account.name,
      institution: account.institution,
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      limitCents: card.limitCents,
      defaultPaymentAccountId: card.defaultPaymentAccountId,
      balanceCents: account.balanceCents,
      availableCents: card.limitCents === null ? null : card.limitCents + Math.min(account.balanceCents, 0),
      currentInvoice: existing
        ? toInvoiceSummary(existing, today)
        : { id: null, ...period, totalCents: 0, status: 'open', paidAt: null },
      archived: account.archived,
    };
  });
}

/** Faturas do cartão, da mais recente para a mais antiga, incluindo a atual mesmo vazia. */
export async function listCardInvoices(
  workspaceId: string,
  accountId: string,
  { today = todayIsoDate() }: { today?: string } = {},
): Promise<InvoiceSummary[]> {
  const [card] = (await listCards(workspaceId, { includeArchived: true, today })).filter(
    (item) => item.id === accountId,
  );
  if (!card) {
    throw new CardError('not-found', 'Cartão não encontrado.');
  }
  const rows = await selectInvoices(workspaceId, [accountId]);
  const list = rows.map((row) => toInvoiceSummary(row, today));
  if (!list.some((invoice) => invoice.referenceMonth === card.currentInvoice.referenceMonth)) {
    list.push(card.currentInvoice);
    list.sort((a, b) => b.referenceMonth.localeCompare(a.referenceMonth));
  }
  return list;
}

async function findInvoice(workspaceId: string, invoiceId: string) {
  if (!z.uuid().safeParse(invoiceId).success) {
    throw new CardError('not-found', 'Fatura não encontrada.');
  }
  const [invoice] = await getDb()
    .select({
      id: cardInvoices.id,
      accountId: cardInvoices.accountId,
      referenceMonth: cardInvoices.referenceMonth,
      paidAt: cardInvoices.paidAt,
      paymentTransferGroupId: cardInvoices.paymentTransferGroupId,
    })
    .from(cardInvoices)
    .where(and(eq(cardInvoices.id, invoiceId), eq(cardInvoices.workspaceId, workspaceId)));
  if (!invoice) {
    throw new CardError('not-found', 'Fatura não encontrada.');
  }
  return invoice;
}

/**
 * Paga a fatura com uma transferência da conta escolhida para o cartão
 * (docs/domain.md) e marca a fatura como paga.
 */
export async function payInvoice(workspaceId: string, invoiceId: string, input: PayInvoiceInput) {
  const { user } = await requireMembership(workspaceId, 'finance.write');
  const data = payInvoiceSchema.parse(input);
  const invoice = await findInvoice(workspaceId, invoiceId);
  if (invoice.paidAt) {
    throw new CardError('already-paid', 'Esta fatura já está paga.');
  }
  const accounts = await listAccounts(workspaceId);
  const from = accounts.find((account) => account.id === data.fromAccountId);
  if (!from || from.type === 'credit_card') {
    throw new CardError('invalid-account', 'Escolha uma conta que não seja cartão para pagar.');
  }

  await getDb().transaction(async (tx) => {
    const transferGroupId = crypto.randomUUID();
    const base = {
      workspaceId,
      kind: 'transfer' as const,
      date: data.date,
      description: `Pagamento da fatura de ${formatMonth(invoice.referenceMonth).toLowerCase()}`,
      status: 'cleared' as const,
      paidAt: data.date,
      transferGroupId,
      createdBy: user.id,
      updatedBy: user.id,
    };
    await tx.insert(transactions).values([
      { ...base, accountId: data.fromAccountId, amountCents: -data.amountCents },
      { ...base, accountId: invoice.accountId, amountCents: data.amountCents },
    ]);
    const [updated] = await tx
      .update(cardInvoices)
      .set({ paidAt: new Date(), paymentTransferGroupId: transferGroupId })
      .where(and(eq(cardInvoices.id, invoiceId), isNull(cardInvoices.paidAt)))
      .returning({ id: cardInvoices.id });
    if (!updated) {
      throw new CardError('already-paid', 'Esta fatura já está paga.');
    }
  });
}

/** Desfaz o pagamento: exclui a transferência e reabre a fatura. */
export async function unpayInvoice(workspaceId: string, invoiceId: string) {
  const { user } = await requireMembership(workspaceId, 'finance.write');
  const invoice = await findInvoice(workspaceId, invoiceId);
  if (!invoice.paidAt) {
    throw new CardError('not-paid', 'Esta fatura não está paga.');
  }
  await getDb().transaction(async (tx) => {
    if (invoice.paymentTransferGroupId) {
      await tx
        .update(transactions)
        .set({ deletedAt: new Date(), updatedBy: user.id })
        .where(
          and(
            eq(transactions.transferGroupId, invoice.paymentTransferGroupId),
            eq(transactions.workspaceId, workspaceId),
            isNull(transactions.deletedAt),
            ne(transactions.kind, 'income'),
          ),
        );
    }
    await tx
      .update(cardInvoices)
      .set({ paidAt: null, paymentTransferGroupId: null })
      .where(eq(cardInvoices.id, invoiceId));
  });
}
