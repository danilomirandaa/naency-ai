import { parseCsvStatement } from './csv';
import { looksLikeOfx, parseOfx } from './ofx';
import { type InvoiceMovement, type ParsedStatement, type ParsedStatementRow, StatementParseError } from './types';

/**
 * Fatura de cartão: compra é saída (negativa). Muitos bancos exportam a fatura
 * com compras positivas e pagamentos/estornos negativos; se a maioria das
 * linhas vier positiva numa conta cartão, o arquivo usa essa convenção e o sinal
 * é invertido. OFX e o layout do Nubank cartão já chegam com compra negativa.
 */
export function normalizeCardSigns(rows: ParsedStatementRow[]): ParsedStatementRow[] {
  // Pela quantidade de linhas, não pela soma: o pagamento da fatura anterior pode valer mais que as compras.
  const positive = rows.filter((row) => row.amountCents > 0).length;
  const negative = rows.filter((row) => row.amountCents < 0).length;
  return positive > negative ? rows.map((row) => ({ ...row, amountCents: -row.amountCents })) : rows;
}

function withoutAccents(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Pagamento da fatura anterior, que o banco lista como crédito dentro da fatura.
 * Não é compra nem estorno: no Naency, pagar fatura é transferência.
 */
export function isInvoicePayment(description: string) {
  const text = withoutAccents(description);
  // "Pagamento de fatura", mas também o "Pagamento recebido" do Nubank. A regra
  // só vale dentro de uma fatura, então "recebido" aqui não é receita.
  return /\b(pagamento|pagto|pgto)\b.*\b(fatura|recebid[oa])\b/i.test(text);
}

/**
 * Saldo da fatura anterior que não foi pago e a fatura nova traz de volta.
 * Já foi lançado no mês passado: importar de novo contaria o gasto duas vezes.
 */
export function isCarriedOverBalance(description: string) {
  const text = withoutAccents(description);
  return /\b(valor|saldo)\b.*\b(pendente|remanescente|anterior|nao pago)\b/i.test(text) || /\bfatura anterior\b/i.test(text);
}

/**
 * Classifica a linha da fatura que não é compra. O sinal decide o lado: o que
 * entra como crédito é o pagamento; o que entra como débito é o saldo trazido.
 */
export function invoiceMovementKind(description: string, amountCents: number): InvoiceMovement | null {
  if (amountCents > 0) {
    return isInvoicePayment(description) ? 'payment' : null;
  }
  if (amountCents < 0) {
    return isCarriedOverBalance(description) ? 'carried-over' : null;
  }
  return null;
}

/** Detecta o formato pelo nome e pelo conteúdo e lê o extrato. */
export function parseStatement(
  fileName: string,
  text: string,
  { accountType }: { accountType?: string } = {},
): ParsedStatement {
  const statement = readStatement(fileName, text);
  if (accountType !== 'credit_card') {
    return statement;
  }
  return {
    ...statement,
    rows: normalizeCardSigns(statement.rows).map((row) => ({
      ...row,
      invoiceMovement: invoiceMovementKind(row.description, row.amountCents),
    })),
  };
}

function readStatement(fileName: string, text: string): ParsedStatement {
  if (text.trim() === '') {
    throw new StatementParseError('empty', 'O arquivo está vazio.');
  }
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'ofx' || extension === 'qfx' || looksLikeOfx(text)) {
    return { format: 'ofx', layout: 'ofx', rows: parseOfx(text) };
  }
  if (extension === 'csv' || extension === 'txt') {
    const { layout, rows } = parseCsvStatement(text);
    return { format: 'csv', layout, rows };
  }
  throw new StatementParseError(
    'unknown-format',
    extension === 'pdf'
      ? 'PDF ainda não é suportado. Exporte o extrato em OFX ou CSV.'
      : 'Formato não suportado. Use OFX ou CSV.',
  );
}
