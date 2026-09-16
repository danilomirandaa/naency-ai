import 'server-only';
import { getAuthRedirect } from '@/lib/auth/routes';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const NO_STORE_HEADERS = ['cache-control', 'expires', 'pragma'];

/**
 * Renova a sessão do Supabase a cada requisição e aplica a checagem otimista de
 * rota (proxy.ts). Não decide permissão: autorização acontece no DAL.
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
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  const target = getAuthRedirect({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    isAuthenticated,
  });

  if (!target) {
    return response;
  }

  // O redirecionamento precisa levar os cookies renovados e os cabeçalhos
  // anti-cache, senão a sessão renovada se perde.
  const redirect = NextResponse.redirect(new URL(target, request.url));
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  for (const header of NO_STORE_HEADERS) {
    const value = response.headers.get(header);
    if (value) {
      redirect.headers.set(header, value);
    }
  }
  return redirect;
}
