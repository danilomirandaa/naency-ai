import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

// Mesmo carregamento de .env* que o Next faz (.env.local incluso).
loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema/index.ts',
  out: './server/db/migrations',
  // Migrations pela conexão em modo sessão (porta 5432); o app usa o pooler em
  // modo transação (6543), que não se dá bem com DDL em transação.
  dbCredentials: {
    url: process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL ?? '',
  },
  schemaFilter: ['public'],
  // Não gerenciar os papéis que o Supabase já cria (anon, authenticated...).
  entities: { roles: { provider: 'supabase' } },
  strict: true,
  verbose: true,
});
