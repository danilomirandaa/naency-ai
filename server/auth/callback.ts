import { LOGIN_PATH, sanitizeNextPath } from '@/lib/auth/routes';
import type { LoginCallbackError } from '@/features/auth/schemas';
import type { CurrentUser } from './current-user';

type ExchangeResult = {
  user: CurrentUser | null;
  error: { code?: string; message: string } | null;
};

export type AuthCallbackDeps = {
  exchangeCodeForSession: (code: string) => Promise<ExchangeResult>;
  ensureProfile: (user: CurrentUser) => Promise<void>;
};

const EXPIRED_CODES = new Set(['otp_expired', 'flow_state_expired', 'flow_state_not_found']);

function loginWithError(code: LoginCallbackError) {
  return `${LOGIN_PATH}?erro=${code}`;
}

/**
 * Processa o retorno do link de acesso e devolve o caminho interno para onde
 * redirecionar. Cria o perfil no primeiro acesso.
 */
export async function handleAuthCallback(url: URL, deps: AuthCallbackDeps): Promise<string> {
  const errorCode = url.searchParams.get('error_code');
  if (errorCode) {
    return loginWithError(EXPIRED_CODES.has(errorCode) ? 'link-expirado' : 'link-invalido');
  }

  const code = url.searchParams.get('code');
  if (!code) {
    return loginWithError('link-invalido');
  }

  const { user, error } = await deps.exchangeCodeForSession(code);
  if (error || !user) {
    return loginWithError(
      error?.code && EXPIRED_CODES.has(error.code) ? 'link-expirado' : 'link-invalido',
    );
  }

  try {
    await deps.ensureProfile(user);
  } catch {
    return loginWithError('falha');
  }

  return sanitizeNextPath(url.searchParams.get('next'));
}
