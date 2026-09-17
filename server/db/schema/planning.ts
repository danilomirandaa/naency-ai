import { RECURRENCE_FREQUENCIES } from '@/lib/recurrence';
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { categories } from './categories';
import { profiles, workspaces } from './workspaces';

export const recurrenceFrequency = pgEnum('recurrence_frequency', RECURRENCE_FREQUENCIES);
export const recurringKind = pgEnum('recurring_kind', ['income', 'expense']);

/** Receita ou despesa que se repete e gera lançamentos previstos (docs/domain.md). */
export const recurringRules = pgTable(
  'recurring_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    kind: recurringKind('kind').notNull(),
    /** Valor positivo; o sinal vem do tipo. */
    amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
    description: text('description').notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    frequency: recurrenceFrequency('frequency').notNull(),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    endDate: date('end_date', { mode: 'string' }),
    /** Ocorrências antes desta data não são geradas (evita atrasados falsos ao criar a regra). */
    generateFrom: date('generate_from', { mode: 'string' }).notNull(),
    active: boolean('active').notNull().default(true),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('recurring_rules_workspace_id_idx').on(table.workspaceId),
    check('recurring_rules_amount', sql`${table.amountCents} > 0`),
    check('recurring_rules_dates', sql`${table.endDate} is null or ${table.endDate} >= ${table.startDate}`),
  ],
).enableRLS();

/** Orçamento mensal por categoria principal de despesa. */
export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('budgets_workspace_category_idx').on(table.workspaceId, table.categoryId),
    check('budgets_amount', sql`${table.amountCents} > 0`),
  ],
).enableRLS();

/** Meta de economia: acompanha o saldo de uma conta (ex.: reserva) até o alvo. */
export const goals = pgTable(
  'goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    targetCents: bigint('target_cents', { mode: 'number' }).notNull(),
    targetDate: date('target_date', { mode: 'string' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('goals_workspace_id_idx').on(table.workspaceId),
    check('goals_target', sql`${table.targetCents} > 0`),
  ],
).enableRLS();
