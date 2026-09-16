import 'server-only';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente do Supabase para Server Components, Server Actions e Route Handlers.
 * Crie um por requisição. Uso restrito a autenticação; dados passam pelo DAL.
 */
export async function createSupabaseServerClient() {
  const { url, publishableKey } = getSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components não podem gravar cookies. A sessão é renovada no
          // proxy (server/supabase/session.ts), então pode ignorar aqui.
        }
      },
    },
  });
}
