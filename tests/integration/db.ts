import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import * as schema from '@/server/db/schema';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

type TestUser = { id: string; email: string | null };

/** Usuário "logado" nos testes. */
export const currentUser: { value: TestUser | null } = { value: null };

let client: PGlite | undefined;
let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getTestDb() {
  if (!db) {
    throw new Error('Banco de teste não iniciado: chame resetTestDb() no beforeEach.');
  }
  return db;
}

/**
 * Banco novo por teste: cria o schema `auth` que o Supabase fornece (só o que o
 * app referencia) e aplica as migrations reais de server/db/migrations.
 */
export async function resetTestDb() {
  await client?.close();
  client = new PGlite();
  await client.exec(`
    create schema auth;
    create table auth.users (id uuid primary key, email text);
  `);
  db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: path.resolve('server/db/migrations') });
  currentUser.value = null;
  return db;
}

/** Cria um usuário no "Supabase Auth" e opcionalmente já o deixa logado. */
export async function createUser(email: string, { signIn = false } = {}): Promise<TestUser> {
  const user = { id: randomUUID(), email };
  await client?.query('insert into auth.users (id, email) values ($1, $2)', [user.id, email]);
  if (signIn) {
    currentUser.value = user;
  }
  return user;
}

export function signInAs(user: TestUser | null) {
  currentUser.value = user;
}

export async function closeTestDb() {
  await client?.close();
  client = undefined;
  db = undefined;
}
