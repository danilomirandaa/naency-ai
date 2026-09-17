import { describe, expect, it } from 'vitest';
import { inviteMemberSchema } from './schemas';

const message = (input: unknown) => inviteMemberSchema.safeParse(input).error?.issues[0]?.message;

describe('inviteMemberSchema', () => {
  it('normaliza o e-mail e aceita editor ou leitor', () => {
    expect(inviteMemberSchema.parse({ email: ' Esposa@Exemplo.com ', role: 'viewer' })).toEqual({
      email: 'esposa@exemplo.com',
      role: 'viewer',
    });
  });

  it('não permite convidar como administrador', () => {
    expect(message({ email: 'a@b.com', role: 'admin' })).toBe('Escolha o papel da pessoa.');
  });

  it('exige e-mail válido', () => {
    expect(message({ email: 'esposa', role: 'editor' })).toBe('Informe um e-mail válido.');
    expect(message({ role: 'editor' })).toBe('Informe o e-mail da pessoa.');
  });
});
