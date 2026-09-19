import { isIsoDate } from '@/lib/dates';
import { parseMoneyInput } from '@/lib/money';
import { normalizeDescription } from '@/lib/transactions';
import { type ParsedStatementRow, StatementParseError } from './types';

/** Lê CSV (RFC 4180) detectando o separador: vírgula, ponto e vírgula ou tab. */
export function parseCsvRecords(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = [';', '\t', ','].reduce((best, candidate) =>
    firstLine.split(candidate).length > firstLine.split(best).length ? candidate : best,
  );
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      record.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') {
        i += 1;
      }
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records.filter((row) => row.some((cell) => cell.trim() !== ''));
}

/** "16/09/2026", "16/09/26" ou "2026-09-16". */
export function parseStatementDate(value: string) {
  const text = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  const br = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/.exec(text);
  const date = iso
    ? `${iso[1]}-${iso[2]}-${iso[3]}`
    : br
      ? `${br[3]?.length === 2 ? `20${br[3]}` : br[3]}-${br[2]}-${br[1]}`
      : null;
  return date && isIsoDate(date) ? date : null;
}

export type CsvLayout = {
  id: string;
  date: number;
  description: number;
  /** Coluna de valor único, ou débito e crédito separados. */
  amount: { column: number } | { debit: number; credit: number };
  /** Cartão exporta compra como valor positivo: inverte o sinal. */
  invertSign: boolean;
  /** Coluna "Parcela" ("3 de 12"), quando a fatura traz. */
  installment?: number;
  /** Coluna "Hora", que alguns extratos trazem. */
  time?: number;
};

const SYNONYMS = {
  date: ['data', 'date', 'data lancamento', 'data do lancamento', 'dt lancamento'],
  description: ['descricao', 'description', 'title', 'historico', 'lancamento', 'estabelecimento', 'memo'],
  amount: ['valor', 'amount', 'valor (r$)', 'valor r$'],
  debit: ['debito', 'saida', 'debit'],
  credit: ['credito', 'entrada', 'credit'],
  installment: ['parcela', 'parcelas'],
  time: ['hora', 'horario', 'time', 'hora lancamento'],
};

/** "04:57:10" ou "4:57" → "04:57:10". Fora disso, `null`. */
export function parseStatementTime(value: string | undefined) {
  const match = /^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/.exec(value ?? '');
  if (!match) {
    return null;
  }
  const [hours, minutes, seconds = '00'] = [match[1] ?? '', match[2] ?? '', match[3]];
  if (Number(hours) > 23 || Number(minutes) > 59 || Number(seconds) > 59) {
    return null;
  }
  return `${hours.padStart(2, '0')}:${minutes}:${seconds}`;
}

/** "3 de 12" → terceira de doze. "-", vazio ou " de 1" (sem número) não é parcelamento. */
export function parseInstallment(value: string | undefined) {
  const match = /^\s*(\d+)\s*(?:de|\/)\s*(\d+)\s*$/.exec(value ?? '');
  const number = Number(match?.[1]);
  const total = Number(match?.[2]);
  return match && total > 1 && number >= 1 && number <= total ? { number, total } : null;
}

function findColumn(headers: string[], names: string[]) {
  return headers.findIndex((header) => names.includes(header));
}

/** Layout pelo cabeçalho: Nubank conta, Nubank cartão ou genérico por sinônimos. `null` se não reconhecer. */
export function detectCsvLayout(rawHeaders: string[]): CsvLayout | null {
  const headers = rawHeaders.map((header) => normalizeDescription(header));
  const joined = headers.join(',');
  if (joined === 'data,valor,identificador,descricao') {
    return { id: 'nubank-conta', date: 0, description: 3, amount: { column: 1 }, invertSign: false };
  }
  if (joined === 'date,title,amount' || joined === 'date,category,title,amount') {
    return {
      id: 'nubank-cartao',
      date: headers.indexOf('date'),
      description: headers.indexOf('title'),
      amount: { column: headers.indexOf('amount') },
      invertSign: true,
    };
  }
  const date = findColumn(headers, SYNONYMS.date);
  const description = findColumn(headers, SYNONYMS.description);
  const amount = findColumn(headers, SYNONYMS.amount);
  const installment = findColumn(headers, SYNONYMS.installment);
  const time = findColumn(headers, SYNONYMS.time);
  const debit = findColumn(headers, SYNONYMS.debit);
  const credit = findColumn(headers, SYNONYMS.credit);
  if (date < 0 || description < 0) {
    return null;
  }
  if (amount >= 0) {
    return {
      id: 'generico',
      date,
      description,
      amount: { column: amount },
      invertSign: false,
      ...(installment >= 0 ? { installment } : {}),
      ...(time >= 0 ? { time } : {}),
    };
  }
  if (debit >= 0 && credit >= 0) {
    return { id: 'generico', date, description, amount: { debit, credit }, invertSign: false };
  }
  return null;
}

function cents(value: string | undefined) {
  if (value === undefined || value.trim() === '') {
    return 0;
  }
  return parseMoneyInput(value);
}

/** Lançamentos de um CSV num layout conhecido. */
export function parseCsvStatement(text: string): { layout: string; rows: ParsedStatementRow[] } {
  const records = parseCsvRecords(text);
  const [headers, ...data] = records;
  if (!headers || data.length === 0) {
    throw new StatementParseError('empty', 'O CSV não tem lançamentos.');
  }
  const layout = detectCsvLayout(headers);
  if (!layout) {
    throw new StatementParseError(
      'unknown-layout',
      'Não reconhecemos as colunas deste CSV. Use um arquivo com colunas de data, descrição e valor, ou exporte em OFX.',
    );
  }
  const rows = data.map((record, index) => {
    const date = parseStatementDate(record[layout.date] ?? '');
    let amount: number | null;
    if ('column' in layout.amount) {
      amount = cents(record[layout.amount.column]);
    } else {
      const debit = cents(record[layout.amount.debit]);
      const credit = cents(record[layout.amount.credit]);
      amount = debit === null || credit === null ? null : credit - Math.abs(debit);
    }
    const description = (record[layout.description] ?? '').trim();
    if (!date || amount === null) {
      throw new StatementParseError('invalid-row', `Linha ${index + 2} do CSV sem data ou valor válidos.`);
    }
    return {
      date,
      amountCents: layout.invertSign ? -amount : amount,
      description: description || 'Sem descrição',
      externalId: null,
      time: layout.time === undefined ? null : parseStatementTime(record[layout.time]),
      installment: layout.installment === undefined ? null : parseInstallment(record[layout.installment]),
      invoiceMovement: null,
    };
  });
  return { layout: layout.id, rows: rows.filter((row) => row.amountCents !== 0) };
}
