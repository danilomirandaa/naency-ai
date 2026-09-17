import { describe, expect, it } from 'vitest';
import { normalizeDescription, signedAmount } from './transactions';

describe('signedAmount', () => {
  it('receita positiva, despesa negativa', () => {
    expect(signedAmount('income', 1500)).toBe(1500);
    expect(signedAmount('expense', 1500)).toBe(-1500);
  });

  it.each([0, -1, 1.5, Number.NaN])('recusa %s', (value) => {
    expect(() => signedAmount('expense', value)).toThrow(RangeError);
  });
});

describe('normalizeDescription', () => {
  it('tira acentos, caixa e espaços extras', () => {
    expect(normalizeDescription('  Padaria   São  JOÃO ')).toBe('padaria sao joao');
  });
});
