import { describe, expect, it } from 'vitest';
import {
  type InvitationRecord,
  evaluateInvitation,
  invitationExpiry,
  maskEmail,
} from './evaluate';

const now = new Date('2026-09-16T12:00:00Z');
const invitation: InvitationRecord = {
  id: 'inv-1',
  workspaceId: 'ws-1',
  workspaceName: 'Finanças da casa',
  email: 'Esposa@Exemplo.com',
  role: 'editor',
  expiresAt: invitationExpiry(now),
  acceptedAt: null,
};

const evaluate = (overrides: Partial<Parameters<typeof evaluateInvitation>[0]> = {}) =>
  evaluateInvitation({
    invitation,
    userEmail: 'esposa@exemplo.com',
    isAlreadyMember: false,
    now,
    ...overrides,
  });

describe('evaluateInvitation', () => {
  it('convite válido para o e-mail convidado (sem diferenciar maiúsculas)', () => {
    expect(evaluate()).toEqual({ status: 'valid', invitation });
  });

  it('inexistente', () => {
    expect(evaluate({ invitation: null })).toEqual({ status: 'not-found' });
  });

  it('já usado', () => {
    expect(evaluate({ invitation: { ...invitation, acceptedAt: now } })).toEqual({
      status: 'used',
    });
  });

  it('expirado no exato instante de expiração', () => {
    expect(evaluate({ invitation: { ...invitation, expiresAt: now } })).toEqual({
      status: 'expired',
    });
  });

  it('outro e-mail não aceita, e só vê o e-mail convidado mascarado', () => {
    expect(evaluate({ userEmail: 'intruso@exemplo.com' })).toEqual({
      status: 'email-mismatch',
      invitedEmail: 'E***@Exemplo.com',
    });
    expect(evaluate({ userEmail: null }).status).toBe('email-mismatch');
  });

  it('quem já é membro não entra duas vezes', () => {
    expect(evaluate({ isAlreadyMember: true })).toEqual({ status: 'already-member', invitation });
  });

  it('usado tem precedência sobre expirado e e-mail diferente', () => {
    expect(
      evaluate({
        invitation: { ...invitation, acceptedAt: now, expiresAt: now },
        userEmail: 'outro@x.com',
      }).status,
    ).toBe('used');
  });
});

describe('invitationExpiry', () => {
  it('vale 7 dias', () => {
    expect(invitationExpiry(now).toISOString()).toBe('2026-09-23T12:00:00.000Z');
  });
});

describe('maskEmail', () => {
  it('mantém a primeira letra e o domínio', () => {
    expect(maskEmail('danilo@exemplo.com')).toBe('d***@exemplo.com');
  });
});
