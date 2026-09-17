import { parseCsvStatement } from './csv';
import { looksLikeOfx, parseOfx } from './ofx';
import { type ParsedStatement, type ParsedStatementRow, StatementParseError } from './types';

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

/** Detecta o formato pelo nome e pelo conteúdo e lê o extrato. */
export function parseStatement(
  fileName: string,
  text: string,
  { accountType }: { accountType?: string } = {},
): ParsedStatement {
  const statement = readStatement(fileName, text);
  return accountType === 'credit_card' ? { ...statement, rows: normalizeCardSigns(statement.rows) } : statement;
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
