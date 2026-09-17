import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { categories } from './categories';
import { profiles, workspaces } from './workspaces';

/** Dados de uma conta do tipo cartão de crédito (docs/domain.md). */
export const creditCardDetails = pgTable(
  'credit_card_details',
  {
    accountId: uuid('account_id')
      .primaryKey()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    closingDay: integer('closing_day').notNull(),
    dueDay: integer('due_day').notNull(),
    limitCents: bigint('limit_cents', { mode: 'number' }),
    defaultPaymentAccountId: uuid('default_payment_account_id').references(
      (): AnyPgColumn => accounts.id,
      { onDelete: 'set null' },
    ),
  },
  (table) => [
    check('credit_card_closing_day', sql`${table.closingDay} between 1 and 31`),
    check('credit_card_due_day', sql`${table.dueDay} between 1 and 31`),
    check('credit_card_limit', sql`${table.limitCents} is null or ${table.limitCents} >= 0`),
  ],
).enableRLS();

/**
 * Faturas criadas sob demanda quando o primeiro lançamento cai nelas. O status
 * é derivado: paga (`paid_at`), aberta até o fechamento, fechada depois.
 */
export const cardInvoices = pgTable(
  'card_invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    /** Mês do vencimento ("2026-10"). */
    referenceMonth: text('reference_month').notNull(),
    closingDate: date('closing_date', { mode: 'string' }).notNull(),
    dueDate: date('due_date', { mode: 'string' }).notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    /** Transferência que pagou a fatura. */
    paymentTransferGroupId: uuid('payment_transfer_group_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('card_invoices_account_month_idx').on(table.accountId, table.referenceMonth),
    check('card_invoices_reference_month', sql`${table.referenceMonth} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`),
  ],
).enableRLS();

/** Compra parcelada: gera um lançamento por parcela, cada um na sua fatura. */
export const installmentGroups = pgTable(
  'installment_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    description: text('description').notNull(),
    totalAmountCents: bigint('total_amount_cents', { mode: 'number' }).notNull(),
    installmentsCount: integer('installments_count').notNull(),
    firstDate: date('first_date', { mode: 'string' }).notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('installment_groups_workspace_id_idx').on(table.workspaceId),
    check('installment_groups_count', sql`${table.installmentsCount} between 2 and 48`),
    check('installment_groups_total', sql`${table.totalAmountCents} > 0`),
  ],
).enableRLS();
