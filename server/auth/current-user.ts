import 'server-only';
import { LOGIN_PATH } from '@/lib/auth/routes';
import { createSupabaseServerClient } from '@/server/supabase/client';
import { redirect } from 'next/navigation';
import { cache } from 'react';

export type CurrentUser = {
  id: string;
  email: string | null;
};

/**
 * Usuário da requisição atual, validado pelo Supabase (getClaims verifica a
 * assinatura do token). Memoizado por requisição com `cache`.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) {
    return null;
  }
  return { id: claims.sub, email: typeof claims.email === 'string' ? claims.email : null };
});

/** Para páginas e layouts: sem sessão, redireciona para o login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(LOGIN_PATH);
  }
  return user;
}
