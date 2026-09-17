import { CATEGORY_KINDS } from '@/lib/categories';
import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

export const categoryKind = pgEnum('category_kind', CATEGORY_KINDS);

/** Categorias do espaço, em até dois níveis (docs/domain.md). */
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'cascade',
    }),
    name: text('name').notNull(),
    kind: categoryKind('kind').notNull(),
    icon: text('icon').notNull(),
    color: text('color').notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('categories_workspace_id_idx').on(table.workspaceId),
    // Nome único por tipo e nível, sem diferenciar maiúsculas.
    uniqueIndex('categories_unique_name_idx').on(
      table.workspaceId,
      table.kind,
      sql`coalesce(${table.parentId}, '00000000-0000-0000-0000-000000000000'::uuid)`,
      sql`lower(${table.name})`,
    ),
    check('categories_color_hex', sql`${table.color} ~ '^#[0-9A-Fa-f]{6}$'`),
    check('categories_not_own_parent', sql`${table.parentId} is null or ${table.parentId} <> ${table.id}`),
  ],
).enableRLS();
