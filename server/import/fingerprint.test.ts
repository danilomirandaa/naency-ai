import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { fingerprintAll, fingerprintOf } = await import('./fingerprint');

const base = { accountId: 'conta', date: '2026-09-02', amountCents: -4590, description: 'Padaria São João' };

describe('fingerprint', () => {
  it('ignora acento, caixa e espaços da descrição', () => {
    expect(fingerprintOf(base, 1)).toBe(fingerprintOf({ ...base, description: '  PADARIA sao   joao' }, 1));
  });

  it('muda com conta, data, valor e ocorrência', () => {
    const reference = fingerprintOf(base, 1);
    expect(fingerprintOf({ ...base, accountId: 'outra' }, 1)).not.toBe(reference);
    expect(fingerprintOf({ ...base, date: '2026-09-03' }, 1)).not.toBe(reference);
    expect(fingerprintOf({ ...base, amountCents: -4591 }, 1)).not.toBe(reference);
    expect(fingerprintOf(base, 2)).not.toBe(reference);
  });

  it('duas compras iguais no mesmo dia ganham impressões diferentes e estáveis', () => {
    const [first, second, other] = fingerprintAll([base, base, { ...base, amountCents: -100 }]);
    expect(first).toBe(fingerprintOf(base, 1));
    expect(second).toBe(fingerprintOf(base, 2));
    expect(other).toBe(fingerprintOf({ ...base, amountCents: -100 }, 1));
  });
});
