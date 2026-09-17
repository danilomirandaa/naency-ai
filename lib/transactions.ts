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

/** Forma de pagamento (opcional no lançamento). */
export const PAYMENT_METHODS = ['pix', 'boleto', 'debit_card', 'credit_card', 'cash', 'bank_transfer'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  boleto: 'Boleto',
  debit_card: 'Débito',
  credit_card: 'Cartão de crédito',
  cash: 'Dinheiro',
  bank_transfer: 'TED/DOC',
};

/**
 * Situação exibida, derivada de status e data: previsto com data anterior a hoje
 * está atrasado. Não é gravada, porque muda sozinha com o passar dos dias.
 */
export const TRANSACTION_SITUATIONS = ['overdue', 'pending', 'paid'] as const;
export type TransactionSituation = (typeof TRANSACTION_SITUATIONS)[number];

export function transactionSituation(status: TransactionStatus, date: string, today: string): TransactionSituation {
  if (status === 'cleared') {
    return 'paid';
  }
  return date < today ? 'overdue' : 'pending';
}

/** Rótulo da situação no tipo do lançamento: "A pagar" em despesa, "Recebida" em receita. */
export function situationLabel(situation: TransactionSituation, kind: TransactionKind) {
  if (situation === 'overdue') {
    return 'Atrasada';
  }
  const labels: Record<TransactionKind, [pending: string, paid: string]> = {
    expense: ['A pagar', 'Paga'],
    income: ['A receber', 'Recebida'],
    transfer: ['Prevista', 'Efetivada'],
  };
  return labels[kind][situation === 'pending' ? 0 : 1];
}

/**
 * Forma de pagamento provável de uma linha importada: cartão pela conta, e Pix,
 * boleto ou TED/DOC por palavras que os bancos usam na descrição.
 */
export function inferPaymentMethod(description: string, accountType: string): PaymentMethod | null {
  if (accountType === 'credit_card') {
    return 'credit_card';
  }
  const text = normalizeDescription(description);
  if (/\bpix\b/.test(text)) {
    return 'pix';
  }
  if (/\b(boleto|pagto? titulo|pagamento de titulo)\b/.test(text)) {
    return 'boleto';
  }
  if (/\b(ted|doc)\b/.test(text)) {
    return 'bank_transfer';
  }
  if (/\b(saque|dinheiro)\b/.test(text)) {
    return 'cash';
  }
  if (/\b(compra (no )?debito|debito visa|debito master|elo debito)\b/.test(text)) {
    return 'debit_card';
  }
  return null;
}

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
