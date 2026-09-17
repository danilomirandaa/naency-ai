import { vi } from 'vitest';

// Módulos do servidor importam 'server-only', que lança fora de Server Components.
vi.mock('server-only', () => ({}));

// Cookies em memória no lugar de next/headers.
const cookieJar = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
    getAll: () => [...cookieJar].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => void cookieJar.set(name, value),
  }),
  headers: async () => new Headers({ origin: 'https://naency.test' }),
}));

// Usuário atual controlado pelos testes (ver tests/integration/db.ts).
vi.mock('@/server/auth/current-user', async () => {
  const { currentUser } = await import('./db');
  return {
    getCurrentUser: async () => currentUser.value,
    requireUser: async () => {
      if (!currentUser.value) {
        throw new Error('requireUser sem usuário');
      }
      return currentUser.value;
    },
  };
});

// Banco: PGlite (Postgres em WebAssembly) com as migrations reais.
vi.mock('@/server/db/client', async () => {
  const { getTestDb } = await import('./db');
  return { getDb: () => getTestDb() };
});

export { cookieJar };
