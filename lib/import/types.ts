/** Linha lida de um extrato, antes de virar lançamento. */
export type ParsedStatementRow = {
  /** "AAAA-MM-DD" */
  date: string;
  /** Centavos com sinal, do ponto de vista da conta: entrada > 0, saída < 0. */
  amountCents: number;
  description: string;
  /** Identificador do banco (FITID do OFX), quando houver. */
  externalId: string | null;
};

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
