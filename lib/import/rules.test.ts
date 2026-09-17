import { describe, expect, it } from 'vitest';
import { type CategorizationRule, matchRule, suggestRulePattern } from './rules';

const rule = (overrides: Partial<CategorizationRule>): CategorizationRule => ({
  id: overrides.pattern ?? 'r',
  matchType: 'contains',
  pattern: 'uber',
  categoryId: 'transporte',
  source: 'user',
  ...overrides,
});

describe('matchRule', () => {
  it('compara sem acento e sem maiúsculas', () => {
    expect(matchRule('PADARIA São João', [rule({ pattern: 'padaria sao', categoryId: 'padaria' })])?.categoryId).toBe(
      'padaria',
    );
  });

  it('usuário vence AI; exata vence contém; padrão mais longo vence', () => {
    const rules = [
      rule({ pattern: 'uber', categoryId: 'ai', source: 'ai' }),
      rule({ pattern: 'uber', categoryId: 'user' }),
      rule({ pattern: 'uber eats', categoryId: 'delivery' }),
      rule({ pattern: 'uber eats pedido', matchType: 'exact', categoryId: 'exata' }),
    ];
    expect(matchRule('Uber trip', rules)?.categoryId).toBe('user');
    expect(matchRule('UBER EATS pedido 123', rules)?.categoryId).toBe('delivery');
    expect(matchRule('Uber Eats Pedido', rules)?.categoryId).toBe('exata');
    expect(matchRule('Mercado', rules)).toBeNull();
  });
});

describe('suggestRulePattern', () => {
  it.each([
    ['UBER *TRIP 1234', 'uber trip'],
    ['Mercado Extra - Parcela 2/3', 'mercado extra - parcela'],
    ['PIX 16/09 Maria', 'pix maria'],
  ])('%s → %s', (description, pattern) => {
    expect(suggestRulePattern(description)).toBe(pattern);
  });
});
