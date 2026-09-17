import { describe, expect, it } from 'vitest';
import { institutionInitials } from '.';

describe('institutionInitials', () => {
  it.each([
    ['Banco do Brasil', 'BB'],
    ['XP Investimentos', 'XP'],
    ['C6 Bank', 'C6'],
    ['Nubank', 'N'],
    ['Itaú', 'I'],
    ['Dinheiro/Carteira', 'DC'],
    ['caixa econômica', 'CE'],
    ['', '?'],
  ])('%j → %s', (name, expected) => {
    expect(institutionInitials(name)).toBe(expected);
  });
});
