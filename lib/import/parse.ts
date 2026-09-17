import { parseCsvStatement } from './csv';
import { looksLikeOfx, parseOfx } from './ofx';
import { type ParsedStatement, StatementParseError } from './types';

/** Detecta o formato pelo nome e pelo conteúdo e lê o extrato. */
export function parseStatement(fileName: string, text: string): ParsedStatement {
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
