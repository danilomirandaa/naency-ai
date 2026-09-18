import { isIsoDate } from '@/lib/dates';
import { type ParsedStatementRow, StatementParseError } from './types';

function tag(block: string, name: string) {
  // SGML (OFX 1.x) não fecha as tags; XML (2.x) fecha. O valor vai até o próximo "<" ou quebra.
  const match = new RegExp(`<${name}>([^<\\r\\n]*)`, 'i').exec(block);
  return match?.[1]?.trim() ?? null;
}

function ofxDate(value: string | null) {
  const match = value ? /^(\d{4})(\d{2})(\d{2})/.exec(value) : null;
  const date = match ? `${match[1]}-${match[2]}-${match[3]}` : null;
  return date && isIsoDate(date) ? date : null;
}

/** DTPOSTED costuma trazer a hora junto ("20260902143000"); sem ela, `null`. */
function ofxTime(value: string | null) {
  const match = value ? /^\d{8}(\d{2})(\d{2})(\d{2})?/.exec(value) : null;
  if (!match) {
    return null;
  }
  const [hours, minutes, seconds = '00'] = [match[1] ?? '', match[2] ?? '', match[3]];
  // Muito banco manda "000000" quando não tem hora: meia-noite exata não ordena nada.
  const time = `${hours}:${minutes}:${seconds}`;
  return Number(hours) > 23 || Number(minutes) > 59 || time === '00:00:00' ? null : time;
}

/** Valor do OFX: "-45.90", "1234.5" ou, em alguns bancos, "-45,90". */
function ofxAmount(value: string | null) {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  if (!/^[+-]?\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const negative = normalized.startsWith('-');
  const [integer = '0', fraction = ''] = normalized.replace(/^[+-]/, '').split('.');
  const cents = Number(integer) * 100 + Number(fraction.padEnd(2, '0'));
  return negative ? -cents : cents;
}

export function looksLikeOfx(text: string) {
  return /<OFX>/i.test(text) || /^\s*OFXHEADER:/i.test(text);
}

/** Lançamentos de um OFX (conta corrente ou cartão). */
export function parseOfx(text: string): ParsedStatementRow[] {
  if (!looksLikeOfx(text)) {
    throw new StatementParseError('unknown-format', 'O arquivo não parece um OFX.');
  }
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  const rows: ParsedStatementRow[] = [];
  for (const [index, rawBlock] of blocks.entries()) {
    const block = rawBlock.split(/<\/STMTTRN>|<\/BANKTRANLIST>/i)[0] ?? '';
    const posted = tag(block, 'DTPOSTED');
    const date = ofxDate(posted);
    const amountCents = ofxAmount(tag(block, 'TRNAMT'));
    if (!date || amountCents === null) {
      throw new StatementParseError('invalid-row', `Lançamento ${index + 1} do OFX sem data ou valor válidos.`);
    }
    const description = tag(block, 'MEMO') || tag(block, 'NAME') || 'Sem descrição';
    rows.push({
      date,
      amountCents,
      description,
      externalId: tag(block, 'FITID') || null,
      time: ofxTime(posted),
      installment: null,
      invoicePayment: false,
    });
  }
  if (rows.length === 0) {
    throw new StatementParseError('empty', 'Nenhum lançamento encontrado no OFX.');
  }
  return rows;
}
