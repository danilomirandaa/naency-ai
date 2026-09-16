import { describe, expect, it, vi } from 'vitest';
import { type MagicLinkDeps, sendMagicLink } from './magic-link';

const origin = 'https://naency.app';

function deps(error: { code?: string; status?: number; message: string } | null = null) {
  return {
    signInWithOtp: vi.fn<MagicLinkDeps['signInWithOtp']>(async () => ({ error })),
  };
}

describe('sendMagicLink', () => {
  it('e-mail inválido não chama o Supabase', async () => {
    const d = deps();
    await expect(sendMagicLink({ email: 'danilo', next: null, origin }, d)).resolves.toEqual({
      status: 'error',
      message: 'Informe um e-mail válido.',
    });
    expect(d.signInWithOtp).not.toHaveBeenCalled();
  });

  it('envia com o e-mail normalizado e o callback do próprio site', async () => {
    const d = deps();
    await expect(
      sendMagicLink({ email: ' Danilo@Exemplo.com ', next: null, origin }, d),
    ).resolves.toEqual({ status: 'sent', email: 'danilo@exemplo.com' });
    expect(d.signInWithOtp).toHaveBeenCalledWith({
      email: 'danilo@exemplo.com',
      options: { emailRedirectTo: 'https://naency.app/auth/callback', shouldCreateUser: true },
    });
  });

  it('preserva o destino interno no callback', async () => {
    const d = deps();
    await sendMagicLink({ email: 'a@b.com', next: '/cartoes?mes=9', origin }, d);
    expect(d.signInWithOtp.mock.calls[0]?.[0].options.emailRedirectTo).toBe(
      'https://naency.app/auth/callback?next=%2Fcartoes%3Fmes%3D9',
    );
  });

  it('descarta destino externo', async () => {
    const d = deps();
    await sendMagicLink({ email: 'a@b.com', next: 'https://evil.com', origin }, d);
    expect(d.signInWithOtp.mock.calls[0]?.[0].options.emailRedirectTo).toBe(
      'https://naency.app/auth/callback',
    );
  });

  it('limite de envio vira mensagem clara', async () => {
    await expect(
      sendMagicLink(
        { email: 'a@b.com', next: null, origin },
        deps({ code: 'over_email_send_rate_limit', status: 429, message: 'rate limit' }),
      ),
    ).resolves.toEqual({
      status: 'error',
      message: 'Muitos envios em pouco tempo. Aguarde alguns minutos e tente de novo.',
    });
  });

  it('erro desconhecido não vaza a mensagem técnica', async () => {
    const result = await sendMagicLink(
      { email: 'a@b.com', next: null, origin },
      deps({ status: 500, message: 'database exploded at 10.0.0.1' }),
    );
    expect(result).toEqual({
      status: 'error',
      message: 'Não foi possível enviar o link agora. Tente de novo.',
    });
  });
});
