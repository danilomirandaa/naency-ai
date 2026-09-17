import { describe, expect, it } from 'vitest';
import { getAuthRedirect, isPublicPath, sanitizeNextPath } from './routes';

describe('isPublicPath', () => {
  it.each(['/entrar', '/entrar/', '/auth/callback', '/auth/qualquer'])('%s é pública', (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each(['/', '/transacoes', '/entrarx', '/authx', '/configuracoes/auth'])(
    '%s é protegida',
    (path) => {
      expect(isPublicPath(path)).toBe(false);
    },
  );
});

describe('sanitizeNextPath', () => {
  it.each([
    ['/transacoes', '/transacoes'],
    ['/transacoes?mes=2026-09', '/transacoes?mes=2026-09'],
    ['/a/../b', '/b'],
  ])('mantém caminho interno %s', (input, expected) => {
    expect(sanitizeNextPath(input)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    '',
    'transacoes',
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    'javascript:alert(1)',
    `/${String.fromCharCode(0)}x`,
    `/${String.fromCharCode(10)}evil`,
  ])('rejeita %j e volta para a raiz', (input) => {
    expect(sanitizeNextPath(input)).toBe('/');
  });
});

describe('getAuthRedirect', () => {
  it('sem sessão em rota protegida manda para o login guardando o destino', () => {
    expect(
      getAuthRedirect({ pathname: '/transacoes', search: '?mes=9', isAuthenticated: false }),
    ).toBe('/entrar?next=%2Ftransacoes%3Fmes%3D9');
  });

  it('sem sessão na raiz manda para o login sem next', () => {
    expect(getAuthRedirect({ pathname: '/', search: '', isAuthenticated: false })).toBe('/entrar');
  });

  it('sem sessão em rota pública segue', () => {
    expect(getAuthRedirect({ pathname: '/entrar', search: '', isAuthenticated: false })).toBeNull();
    expect(
      getAuthRedirect({ pathname: '/auth/callback', search: '?code=x', isAuthenticated: false }),
    ).toBeNull();
  });

  it('com sessão, a tela de login manda para a raiz', () => {
    expect(getAuthRedirect({ pathname: '/entrar', search: '', isAuthenticated: true })).toBe('/');
  });

  it('com sessão, rotas protegidas e o callback seguem', () => {
    expect(getAuthRedirect({ pathname: '/cartoes', search: '', isAuthenticated: true })).toBeNull();
    expect(
      getAuthRedirect({ pathname: '/auth/callback', search: '', isAuthenticated: true }),
    ).toBeNull();
  });
});

describe('rotas de API', () => {
  it('não redireciona: sem sessão, quem responde é o Route Handler (401 em JSON)', () => {
    expect(getAuthRedirect({ pathname: '/api/workspaces/x/accounts', search: '?arquivadas=1', isAuthenticated: false })).toBeNull();
    expect(getAuthRedirect({ pathname: '/api/workspaces/x/accounts', search: '', isAuthenticated: true })).toBeNull();
  });
});
