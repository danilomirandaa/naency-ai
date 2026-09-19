/** Linha lida de um extrato, antes de virar lançamento. */
export type ParsedStatementRow = {
  /** "AAAA-MM-DD" */
  date: string;
  /** Centavos com sinal, do ponto de vista da conta: entrada > 0, saída < 0. */
  amountCents: number;
  description: string;
  /** Identificador do banco (FITID do OFX), quando houver. */
  externalId: string | null;
  /** Hora do lançamento ("HH:MM:SS") quando o extrato traz; ordena o dia. */
  time: string | null;
  /** Compra parcelada, quando a fatura informa ("3 de 12"). */
  installment: { number: number; total: number } | null;
  /** Linha que é movimento da própria fatura, não compra (ver `InvoiceMovement`). */
  invoiceMovement: InvoiceMovement | null;
};

/**
 * O que a fatura lista mas não é gasto do mês:
 * - `payment`: o pagamento da fatura anterior, que o banco mostra como crédito.
 * - `carried-over`: o saldo da fatura anterior que não foi pago e veio junto.
 *
 * Os dois se anulam no total da fatura; importados como lançamento, inflariam
 * receitas e despesas com dinheiro que não entrou nem saiu neste mês.
 */
export type InvoiceMovement = 'payment' | 'carried-over';

export type StatementFormat = 'ofx' | 'csv';

export type ParsedStatement = {
  format: StatementFormat;
  /** Layout reconhecido ("ofx", "nubank-conta", "nubank-cartao", "generico"). */
  layout: string;
  rows: ParsedStatementRow[];
};

export class StatementParseError extends Error {
  constructor(
    public readonly code: 'empty' | 'unknown-format' | 'unknown-layout' | 'invalid-row',
    message: string,
  ) {
    super(message);
    this.name = 'StatementParseError';
  }
}
