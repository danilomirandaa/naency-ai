import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

type CookieToSet = { name: string; value: string; options: Record<string, unknown> };
type Handlers = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieToSet[], headers: Record<string, string>) => void;
};

const getClaims = vi.fn();
let captured: Handlers | undefined;

vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: Handlers }) => {
    captured = options.cookies;
    return { auth: { getClaims } };
  },
}));

const { updateSession } = await import('./session');

const signedIn = { data: { claims: { sub: 'user-1' } }, error: null };
const signedOut = { data: null, error: null };

function renewDuringGetClaims(result: unknown) {
  getClaims.mockImplementation(async () => {
    captured?.setAll(
      [{ name: 'sb-token', value: 'novo', options: { httpOnly: true, path: '/' } }],
      {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
        Expires: '0',
        Pragma: 'no-cache',
      },
    );
    return result;
  });
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://projeto.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x');
  getClaims.mockReset();
  captured = undefined;
});

describe('updateSession', () => {
  it('sempre valida a sessão chamando getClaims', async () => {
    getClaims.mockResolvedValue(signedIn);
    await updateSession(new NextRequest('https://naency.app/'));
    expect(getClaims).toHaveBeenCalledTimes(1);
  });

  it('entrega ao Supabase os cookies da requisição', async () => {
    getClaims.mockResolvedValue(signedIn);
    await updateSession(
      new NextRequest('https://naency.app/', { headers: { cookie: 'sb-token=abc' } }),
    );
    expect(captured?.getAll()).toEqual([{ name: 'sb-token', value: 'abc' }]);
  });

  it('com sessão e sem renovação, segue sem cookie nem cabeçalho de cache', async () => {
    getClaims.mockResolvedValue(signedIn);
    const response = await updateSession(new NextRequest('https://naency.app/'));
    expect(response.headers.get('location')).toBeNull();
    expect(response.cookies.getAll()).toEqual([]);
    expect(response.headers.get('cache-control')).toBeNull();
  });

  it('ao renovar, grava o cookie novo e impede cache da resposta', async () => {
    renewDuringGetClaims(signedIn);
    const response = await updateSession(new NextRequest('https://naency.app/'));
    expect(response.cookies.get('sb-token')?.value).toBe('novo');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('pragma')).toBe('no-cache');
  });

  it('sem sessão em rota protegida redireciona para o login com o destino', async () => {
    getClaims.mockResolvedValue(signedOut);
    const response = await updateSession(new NextRequest('https://naency.app/cartoes?mes=9'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://naency.app/entrar?next=%2Fcartoes%3Fmes%3D9',
    );
  });

  it('sem sessão na tela de login não redireciona', async () => {
    getClaims.mockResolvedValue(signedOut);
    const response = await updateSession(new NextRequest('https://naency.app/entrar'));
    expect(response.headers.get('location')).toBeNull();
  });

  it('com sessão, a tela de login redireciona para a raiz', async () => {
    getClaims.mockResolvedValue(signedIn);
    const response = await updateSession(new NextRequest('https://naency.app/entrar'));
    expect(response.headers.get('location')).toBe('https://naency.app/');
  });

  it('o redirecionamento leva o cookie renovado e o bloqueio de cache', async () => {
    renewDuringGetClaims(signedIn);
    const response = await updateSession(new NextRequest('https://naency.app/entrar'));
    expect(response.headers.get('location')).toBe('https://naency.app/');
    expect(response.cookies.get('sb-token')?.value).toBe('novo');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
});
