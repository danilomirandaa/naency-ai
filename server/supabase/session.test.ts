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

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://projeto.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x');
  getClaims.mockReset();
  captured = undefined;
});

describe('updateSession', () => {
  it('sempre valida a sessão chamando getClaims', async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    await updateSession(new NextRequest('https://naency.app/'));
    expect(getClaims).toHaveBeenCalledTimes(1);
  });

  it('entrega ao Supabase os cookies da requisição', async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    await updateSession(
      new NextRequest('https://naency.app/', { headers: { cookie: 'sb-token=abc' } }),
    );
    expect(captured?.getAll()).toEqual([{ name: 'sb-token', value: 'abc' }]);
  });

  it('sem renovação, não grava cookie nem cabeçalho de cache', async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    const response = await updateSession(new NextRequest('https://naency.app/'));
    expect(response.cookies.getAll()).toEqual([]);
    expect(response.headers.get('cache-control')).toBeNull();
  });

  it('ao renovar, grava o cookie novo e impede cache da resposta', async () => {
    getClaims.mockImplementation(async () => {
      captured?.setAll(
        [{ name: 'sb-token', value: 'novo', options: { httpOnly: true, path: '/' } }],
        {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
          Expires: '0',
          Pragma: 'no-cache',
        },
      );
      return { data: null, error: null };
    });

    const response = await updateSession(new NextRequest('https://naency.app/'));

    expect(response.cookies.get('sb-token')?.value).toBe('novo');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('pragma')).toBe('no-cache');
  });
});
