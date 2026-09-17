import { normalizeDescription } from '@/lib/transactions';

export type CategorizationRule = {
  id: string;
  matchType: 'contains' | 'exact';
  /** Já normalizado (sem acento, minúsculo). */
  pattern: string;
  categoryId: string;
  source: 'user' | 'ai';
};

/**
 * Regra que se aplica à descrição: do usuário antes da AI, exata antes de
 * "contém", e o padrão mais longo (mais específico) primeiro.
 */
export function matchRule<T extends CategorizationRule>(description: string, rules: T[]): T | null {
  const normalized = normalizeDescription(description);
  const ranked = [...rules].sort(
    (a, b) =>
      Number(a.source === 'ai') - Number(b.source === 'ai') ||
      Number(a.matchType === 'contains') - Number(b.matchType === 'contains') ||
      b.pattern.length - a.pattern.length,
  );
  return (
    ranked.find((rule) =>
      rule.matchType === 'exact' ? normalized === rule.pattern : normalized.includes(rule.pattern),
    ) ?? null
  );
}

/**
 * Padrão para "lembrar esta categoria": descrição normalizada sem números
 * (datas, parcelas, códigos), para valer para as próximas ocorrências.
 */
export function suggestRulePattern(description: string) {
  return normalizeDescription(description)
    .replace(/\d+([/.-]\d+)*/g, ' ')
    .replace(/[*#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
