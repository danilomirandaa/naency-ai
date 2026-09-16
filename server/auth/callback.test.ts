import { describe, expect, it, vi } from 'vitest';
import { handleAuthCallback } from './callback';

vi.mock('./current-user', () => ({}));

const user = { id: 'user-1', email: 'danilo@exemplo.com' };

function deps(result: { user: typeof user | null; error: { code?: string; message: string } | null }) {
  return {
    exchangeCodeForSession: vi.fn(async () => result),
    ensureProfile: vi.fn(async () => {}),
  };
}

const url = (query: string) => new URL(`https://naency.app/auth/callback${query}`);

describe('handleAuthCallback', () => {
  it('sucesso: troca o código, cria o perfil e vai para o destino', async () => {
    const d = deps({ user, error: null });
    await expect(handleAuthCallback(url('?code=abc&next=%2Fcartoes'), d)).resolves.toBe('/cartoes');
    expect(d.exchangeCodeForSession).toHaveBeenCalledWith('abc');
    expect(d.ensureProfile).toHaveBeenCalledWith(user);
  });

  it('sem next vai para a raiz; next externo é descartado', async () => {
    await expect(handleAuthCallback(url('?code=abc'), deps({ user, error: null }))).resolves.toBe('/');
    await expect(
      handleAuthCallback(url('?code=abc&next=https%3A%2F%2Fevil.com'), deps({ user, error: null })),
    ).resolves.toBe('/');
  });

  it('sem código volta ao login com link inválido', async () => {
    const d = deps({ user, error: null });
    await expect(handleAuthCallback(url(''), d)).resolves.toBe('/entrar?erro=link-invalido');
    expect(d.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('link expirado informado pelo Supabase na URL', async () => {
    await expect(
      handleAuthCallback(url('?error=access_denied&error_code=otp_expired'), deps({ user, error: null })),
    ).resolves.toBe('/entrar?erro=link-expirado');
  });

  it('código expirado na troca', async () => {
    await expect(
      handleAuthCallback(
        url('?code=abc'),
        deps({ user: null, error: { code: 'flow_state_expired', message: 'expired' } }),
      ),
    ).resolves.toBe('/entrar?erro=link-expirado');
  });

  it('outro erro na troca', async () => {
    await expect(
      handleAuthCallback(url('?code=abc'), deps({ user: null, error: { message: 'bad' } })),
    ).resolves.toBe('/entrar?erro=link-invalido');
  });

  it('falha ao criar perfil não deixa entrar', async () => {
    const d = deps({ user, error: null });
    d.ensureProfile.mockRejectedValueOnce(new Error('db down'));
    await expect(handleAuthCallback(url('?code=abc&next=%2Fcartoes'), d)).resolves.toBe(
      '/entrar?erro=falha',
    );
  });
});
