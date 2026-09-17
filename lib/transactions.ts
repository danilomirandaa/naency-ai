/** Lançamentos (docs/domain.md). */
export const TRANSACTION_KINDS = ['expense', 'income', 'transfer'] as const;
export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

export const TRANSACTION_KIND_LABELS: Record<TransactionKind, string> = {
  expense: 'Despesa',
  income: 'Receita',
  transfer: 'Transferência',
};

export const TRANSACTION_STATUSES = ['cleared', 'planned'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

/**
 * Valor com sinal a partir do valor digitado (sempre positivo): receita > 0,
 * despesa < 0. Em transferência, a perna de saída é negativa.
 */
export function signedAmount(kind: 'income' | 'expense', magnitudeCents: number) {
  if (!Number.isSafeInteger(magnitudeCents) || magnitudeCents <= 0) {
    throw new RangeError(`Valor inválido: ${magnitudeCents}`);
  }
  return kind === 'income' ? magnitudeCents : -magnitudeCents;
}

/** Descrição comparável: sem acento, minúscula, espaços únicos. */
export function normalizeDescription(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
