import { describe, expect, it } from 'vitest';
import { getSupabasePublicEnv } from './env';

describe('getSupabasePublicEnv', () => {
  it('retorna URL e chave quando válidas', () => {
    expect(
      getSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://projeto.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
      }),
    ).toEqual({ url: 'https://projeto.supabase.co', publishableKey: 'sb_publishable_x' });
  });

  it('explica o que falta quando as variáveis não existem', () => {
    expect(() => getSupabasePublicEnv({})).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL.*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    );
  });

  it('rejeita URL inválida', () => {
    expect(() =>
      getSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'projeto.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL ausente ou inválida/);
  });

  it('rejeita chave vazia', () => {
    expect(() =>
      getSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://projeto.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausente/);
  });
});
