import { handleAuthCallback } from '@/server/auth/callback';
import { ensureProfile } from '@/server/dal/profiles';
import { createSupabaseServerClient } from '@/server/supabase/client';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const path = await handleAuthCallback(request.nextUrl, {
    exchangeCodeForSession: async (code) => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      return {
        user: data.user ? { id: data.user.id, email: data.user.email ?? null } : null,
        error: error ? { code: error.code, message: error.message } : null,
      };
    },
    ensureProfile,
  });

  return NextResponse.redirect(new URL(path, request.url));
}
