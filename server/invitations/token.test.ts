import { describe, expect, it } from 'vitest';
import { createInvitationToken, hashInvitationToken, isWellFormedInvitationToken } from './token';

describe('invitation token', () => {
  it('gera token bem formado e hash sha-256 correspondente', () => {
    const { token, tokenHash } = createInvitationToken();
    expect(isWellFormedInvitationToken(token)).toBe(true);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInvitationToken(token)).toBe(tokenHash);
  });

  it('o hash não contém o token', () => {
    const { token, tokenHash } = createInvitationToken();
    expect(tokenHash).not.toContain(token);
  });

  it('tokens não se repetem', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => createInvitationToken().token));
    expect(tokens.size).toBe(200);
  });

  it.each(['', 'curto', 'a'.repeat(44), `${'a'.repeat(42)}!`, `../${'a'.repeat(40)}`])(
    'rejeita token malformado %j',
    (token) => {
      expect(isWellFormedInvitationToken(token)).toBe(false);
    },
  );
});
