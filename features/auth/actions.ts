'use server';

import { LOGIN_PATH } from '@/lib/auth/routes';
import { sendMagicLink } from '@/server/auth/magic-link';
import { createSupabaseServerClient } from '@/server/supabase/client';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { LoginState } from './schemas';

export async function sendMagicLinkAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const requestHeaders = await headers();
  const origin =
    requestHeaders.get('origin') ??
    `${requestHeaders.get('x-forwarded-proto') ?? 'https'}://${requestHeaders.get('host')}`;
  const supabase = await createSupabaseServerClient();

  return sendMagicLink(
    { email: formData.get('email'), next: formData.get('next'), origin },
    { signInWithOtp: (params) => supabase.auth.signInWithOtp(params) },
  );
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}
