import { ACCOUNT_TYPES, INSTITUTION_KINDS } from '@/lib/accounts';
import { sql } from 'drizzle-orm';
import {
  bigint,
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
import { profiles, workspaces } from './workspaces';

export const institutionKind = pgEnum('institution_kind', INSTITUTION_KINDS);
export const accountType = pgEnum('account_type', ACCOUNT_TYPES);

/**
 * Bancos, corretoras e carteira. `workspace_id` nulo = catálogo global (semeado
 * na migration); preenchido = instituição cadastrada por um espaço.
 */
export const institutions = pgTable(
  'institutions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    /** Identificador estável do catálogo global (ex.: "nubank"). */
    slug: text('slug'),
    name: text('name').notNull(),
    kind: institutionKind('kind').notNull(),
    compeCode: text('compe_code'),
    color: text('color').notNull(),
    importFormats: text('import_formats').array().notNull().default(sql`'{}'::text[]`),
    exportInstructions: text('export_instructions'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('institutions_slug_idx').on(table.slug),
    index('institutions_workspace_id_idx').on(table.workspaceId),
    check('institutions_color_hex', sql`${table.color} ~ '^#[0-9A-Fa-f]{6}$'`),
  ],
).enableRLS();

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    institutionId: uuid('institution_id').references(() => institutions.id, {
      onDelete: 'restrict',
    }),
    name: text('name').notNull(),
    type: accountType('type').notNull(),
    currency: text('currency').notNull().default('BRL'),
    /** Centavos com sinal. Saldo = inicial + lançamentos a partir da data (docs/domain.md). */
    initialBalanceCents: bigint('initial_balance_cents', { mode: 'number' }).notNull().default(0),
    initialBalanceDate: date('initial_balance_date', { mode: 'string' }).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
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
  },
  (table) => [index('accounts_workspace_id_idx').on(table.workspaceId)],
).enableRLS();
