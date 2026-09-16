import 'server-only';
import * as schema from '@/server/db/schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL ausente. Configure no .env.local (docs/architecture.md).');
  }
  // prepare: false é exigido pelo pooler do Supabase em modo transação.
  const client = postgres(url, { prepare: false });
  return drizzle({ client, schema });
}

type Db = ReturnType<typeof createDb>;

// Reaproveita a conexão entre recarregamentos do dev server.
const globalForDb = globalThis as unknown as { naencyDb?: Db };

export function getDb(): Db {
  globalForDb.naencyDb ??= createDb();
  return globalForDb.naencyDb;
}
