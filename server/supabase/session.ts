import 'server-only';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Renova a sessão do Supabase a cada requisição (chamado pelo `proxy.ts`).
 * Não decide permissão: autorização acontece no DAL.
 */
export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabasePublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Resposta que grava cookie de sessão não pode ser cacheada por CDN,
        // senão o token de um usuário poderia ser entregue a outro.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Obrigatório: é esta chamada que valida o token e dispara a renovação.
  // Não coloque código entre a criação do cliente e ela.
  await supabase.auth.getClaims();

  return response;
}
