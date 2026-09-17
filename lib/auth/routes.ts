/** Rotas de autenticação e regras de redirecionamento (proxy e callback). */
export const LOGIN_PATH = '/entrar';
export const AUTH_CALLBACK_PATH = '/auth/callback';
export const HOME_PATH = '/';

const PUBLIC_PREFIXES = [LOGIN_PATH, '/auth/'];

/** Rotas de dados: sem sessão respondem 401 em JSON, nunca HTML de login. */
export const API_PREFIX = '/api/';

export function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) =>
    prefix.endsWith('/')
      ? pathname.startsWith(prefix)
      : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasUnsafeCharacter(value: string) {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (char === '\\' || code < 0x20 || code === 0x7f) {
      return true;
    }
  }
  return false;
}

/**
 * Só aceita caminho interno ("/transacoes?mes=9"). Rejeita URL absoluta,
 * protocolo relativo ("//evil.com"), barra invertida e caracteres de controle:
 * evita redirecionamento aberto via ?next=.
 */
export function sanitizeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || hasUnsafeCharacter(value)) {
    return HOME_PATH;
  }
  try {
    const base = 'http://naency.local';
    const url = new URL(value, base);
    if (url.origin !== base) {
      return HOME_PATH;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return HOME_PATH;
  }
}

/** Para onde mandar a requisição, ou `null` para seguir normalmente. */
export function getAuthRedirect({
  pathname,
  search,
  isAuthenticated,
}: {
  pathname: string;
  search: string;
  isAuthenticated: boolean;
}): string | null {
  // Chamada de dados não é navegação: redirecionar faria o fetch receber a
  // página de login em HTML e quebrar ao ler o JSON. O Route Handler responde 401.
  if (pathname.startsWith(API_PREFIX)) {
    return null;
  }

  if (!isAuthenticated && !isPublicPath(pathname)) {
    const target = `${pathname}${search}`;
    return target === HOME_PATH
      ? LOGIN_PATH
      : `${LOGIN_PATH}?next=${encodeURIComponent(target)}`;
  }

  if (isAuthenticated && (pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`))) {
    return HOME_PATH;
  }

  return null;
}
