import { getSupabasePublicEnv } from '@/lib/supabase/env';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente do Supabase no navegador. Uso restrito a autenticação (login,
 * logout, sessão): dados passam pelo DAL no servidor (docs/architecture.md).
 */
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabasePublicEnv();
  return createBrowserClient(url, publishableKey);
}
