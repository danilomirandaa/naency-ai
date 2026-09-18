import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { categories } from './categories';
import { profiles, workspaces } from './workspaces';

export const importBatchStatus = pgEnum('import_batch_status', ['review', 'committed', 'discarded']);
export const ruleMatchType = pgEnum('rule_match_type', ['contains', 'exact']);
export const ruleSource = pgEnum('rule_source', ['user', 'ai']);

/** Um arquivo importado para uma conta (docs/import-and-onboarding.md). */
export const importBatches = pgTable(
  'import_batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    format: text('format').notNull(),
    layout: text('layout').notNull(),
    status: importBatchStatus('status').notNull().default('review'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    committedAt: timestamp('committed_at', { withTimezone: true }),
  },
  (table) => [index('import_batches_workspace_id_idx').on(table.workspaceId)],
).enableRLS();

/** Linha lida do arquivo, revisada antes de virar lançamento. */
export const importRows = pgTable(
  'import_rows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => importBatches.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    /** Hora do extrato, quando o arquivo traz. */
    occurredTime: time('occurred_time'),
    amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
    description: text('description').notNull(),
    rawDescription: text('raw_description').notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    /** Regra que sugeriu a categoria, quando houver. */
    ruleId: uuid('rule_id'),
    include: boolean('include').notNull().default(true),
    /** Nome e categoria vieram da AI (a pessoa pode corrigir). */
    aiSuggested: boolean('ai_suggested').notNull().default(false),
    /** Criar regra com a categoria escolhida ao confirmar. */
    rememberCategory: boolean('remember_category').notNull().default(false),
    fingerprint: text('fingerprint').notNull(),
    duplicateOfTransactionId: uuid('duplicate_of_transaction_id'),
    /** Compra parcelada, quando a fatura informa ("3 de 12"). */
    installmentNumber: integer('installment_number'),
    installmentTotal: integer('installment_total'),
    /** Pagamento da fatura anterior listado dentro da fatura: entra desmarcado. */
    invoicePayment: boolean('invoice_payment').notNull().default(false),
  },
  (table) => [uniqueIndex('import_rows_batch_position_idx').on(table.batchId, table.position)],
).enableRLS();

/** Memória de categorização: aplicada antes da AI (docs/domain.md). */
export const categorizationRules = pgTable(
  'categorization_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    matchType: ruleMatchType('match_type').notNull().default('contains'),
    pattern: text('pattern').notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    renameTo: text('rename_to'),
    source: ruleSource('source').notNull().default('user'),
    hits: integer('hits').notNull().default(0),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('categorization_rules_unique_idx').on(table.workspaceId, table.matchType, table.pattern, table.source),
    index('categorization_rules_workspace_id_idx').on(table.workspaceId),
    check('categorization_rules_pattern_length', sql`length(${table.pattern}) >= 3`),
  ],
).enableRLS();

/** Consumo da AI por espaço, para acompanhar custo (docs/domain.md). */
export const aiUsageEvents = pgTable(
  'ai_usage_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    task: text('task').notNull(),
    model: text('model').notNull(),
    inputTokens: integer('input_tokens').notNull(),
    outputTokens: integer('output_tokens').notNull(),
    importBatchId: uuid('import_batch_id').references(() => importBatches.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('ai_usage_events_workspace_id_idx').on(table.workspaceId)],
).enableRLS();
