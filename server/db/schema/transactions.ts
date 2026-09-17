import { TRANSACTION_KINDS, TRANSACTION_STATUSES } from '@/lib/transactions';
import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { cardInvoices, installmentGroups } from './cards';
import { categories } from './categories';
import { importBatches } from './imports';
import { recurringRules } from './planning';
import { profiles, workspaces } from './workspaces';

export const transactionKind = pgEnum('transaction_kind', TRANSACTION_KINDS);
export const transactionStatus = pgEnum('transaction_status', TRANSACTION_STATUSES);

/**
 * Lançamentos (docs/domain.md). Transferência = duas linhas com o mesmo
 * `transfer_group_id`, uma em cada conta, com valores opostos.
 */
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    kind: transactionKind('kind').notNull(),
    /** Centavos com sinal: receita > 0, despesa < 0. */
    amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    description: text('description').notNull(),
    rawDescription: text('raw_description'),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    status: transactionStatus('status').notNull().default('cleared'),
    transferGroupId: uuid('transfer_group_id'),
    /** Fatura do cartão (só em lançamentos de conta cartão que não são transferência). */
    invoiceId: uuid('invoice_id').references((): AnyPgColumn => cardInvoices.id, { onDelete: 'set null' }),
    installmentGroupId: uuid('installment_group_id').references((): AnyPgColumn => installmentGroups.id, {
      onDelete: 'set null',
    }),
    installmentNumber: integer('installment_number'),
    installmentTotal: integer('installment_total'),
    importBatchId: uuid('import_batch_id').references((): AnyPgColumn => importBatches.id, { onDelete: 'set null' }),
    recurringRuleId: uuid('recurring_rule_id').references((): AnyPgColumn => recurringRules.id, {
      onDelete: 'set null',
    }),
    /** Data prevista pela regra; a data do lançamento pode ser mudada à mão. */
    recurrenceDate: date('recurrence_date', { mode: 'string' }),
    /** Deduplicação de importações (server/import/fingerprint.ts). */
    fingerprint: text('fingerprint'),
    notes: text('notes'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => profiles.id),
    updatedBy: uuid('updated_by')
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('transactions_workspace_date_idx').on(table.workspaceId, table.date),
    index('transactions_account_id_idx').on(table.accountId),
    index('transactions_category_id_idx').on(table.categoryId),
    index('transactions_transfer_group_id_idx').on(table.transferGroupId),
    index('transactions_invoice_id_idx').on(table.invoiceId),
    index('transactions_installment_group_id_idx').on(table.installmentGroupId),
    index('transactions_account_fingerprint_idx').on(table.accountId, table.fingerprint),
    // Uma ocorrência por data prevista, mesmo excluída: excluir não faz ela voltar.
    uniqueIndex('transactions_recurrence_idx').on(table.recurringRuleId, table.recurrenceDate),
    check(
      'transactions_amount_sign',
      sql`(${table.kind} = 'income' and ${table.amountCents} > 0)
        or (${table.kind} = 'expense' and ${table.amountCents} < 0)
        or (${table.kind} = 'transfer' and ${table.amountCents} <> 0)`,
    ),
    check(
      'transactions_transfer_shape',
      sql`(${table.kind} = 'transfer') = (${table.transferGroupId} is not null)
        and (${table.kind} <> 'transfer' or ${table.categoryId} is null)`,
    ),
  ],
).enableRLS();
