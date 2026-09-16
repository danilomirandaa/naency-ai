import { describe, expect, it } from 'vitest';
import { getLoginCallbackErrorMessage, loginSchema } from './schemas';

describe('loginSchema', () => {
  it('normaliza o e-mail (espaços e maiúsculas)', () => {
    expect(loginSchema.parse({ email: '  Danilo@Exemplo.COM ' }).email).toBe('danilo@exemplo.com');
  });

  it.each(['', 'danilo', 'danilo@', '@exemplo.com'])('rejeita "%s"', (email) => {
    const result = loginSchema.safeParse({ email });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Informe um e-mail válido.');
  });

  it('sem e-mail pede o e-mail', () => {
    expect(loginSchema.safeParse({}).error?.issues[0]?.message).toBe('Informe seu e-mail.');
  });
});

describe('getLoginCallbackErrorMessage', () => {
  it('traduz códigos conhecidos', () => {
    expect(getLoginCallbackErrorMessage('link-expirado')).toMatch(/expirou/);
  });

  it.each([null, undefined, '', 'desconhecido', 'toString'])('ignora %s', (code) => {
    expect(getLoginCallbackErrorMessage(code)).toBeNull();
  });
});
