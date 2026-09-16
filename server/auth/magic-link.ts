import { AUTH_CALLBACK_PATH, sanitizeNextPath } from '@/lib/auth/routes';
import { type LoginState, loginSchema } from '@/features/auth/schemas';

type OtpError = { code?: string; status?: number; message: string } | null;

export type MagicLinkDeps = {
  signInWithOtp: (params: {
    email: string;
    options: { emailRedirectTo: string; shouldCreateUser: boolean };
  }) => Promise<{ error: OtpError }>;
};

/** Mensagem para a pessoa a partir do erro do Supabase Auth. */
export function magicLinkErrorMessage(error: NonNullable<OtpError>) {
  if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
    return 'Muitos envios em pouco tempo. Aguarde alguns minutos e tente de novo.';
  }
  if (error.code === 'email_address_invalid') {
    return 'Esse e-mail não pode receber o link. Confira o endereço.';
  }
  return 'Não foi possível enviar o link agora. Tente de novo.';
}

/** Valida o formulário e envia o link de acesso (cria a conta no primeiro uso). */
export async function sendMagicLink(
  input: { email: unknown; next: unknown; origin: string },
  deps: MagicLinkDeps,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: input.email,
    next: typeof input.next === 'string' ? input.next : undefined,
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'E-mail inválido.' };
  }

  const callback = new URL(AUTH_CALLBACK_PATH, input.origin);
  const next = sanitizeNextPath(parsed.data.next);
  if (next !== '/') {
    callback.searchParams.set('next', next);
  }

  const { error } = await deps.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callback.toString(), shouldCreateUser: true },
  });

  if (error) {
    return { status: 'error', message: magicLinkErrorMessage(error) };
  }
  return { status: 'sent', email: parsed.data.email };
}
