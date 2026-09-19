/**
 * Dinheiro no Naency: sempre centavos inteiros (docs/architecture.md). Toda
 * conversão entre texto e valor passa por aqui.
 *
 * `number` basta no cliente: inteiros exatos até 2^53 centavos (~90 quatrilhões
 * de reais). No banco a coluna é bigint.
 */
export const DEFAULT_CURRENCY = 'BRL';

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string, signDisplay: Intl.NumberFormatOptions['signDisplay']) {
  const key = `${currency}:${signDisplay}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      signDisplay,
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

export function assertCents(cents: number) {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError(`Valor em centavos inválido: ${cents}`);
  }
}

/** "R$ 1.234,56". `signDisplay: 'exceptZero'` mostra "+R$ 10,00" em receitas. */
export function formatMoney(
  cents: number,
  {
    currency = DEFAULT_CURRENCY,
    signDisplay = 'auto',
  }: { currency?: string; signDisplay?: Intl.NumberFormatOptions['signDisplay'] } = {},
) {
  assertCents(cents);
  // Divisão por 100 só na borda de exibição; Intl arredonda para 2 casas.
  return formatterFor(currency, signDisplay).format(cents / 100);
}

const compactFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: DEFAULT_CURRENCY,
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/**
 * "R$ 2,4 mil": valor curto para eixo de gráfico, onde o número exato não cabe
 * e nem importa (o tooltip mostra o exato).
 */
export function formatMoneyCompact(cents: number) {
  assertCents(cents);
  return compactFormatter.format(cents / 100);
}

/** "1.234,56" sem símbolo, para o valor dentro de um campo. */
export function formatMoneyInput(cents: number) {
  assertCents(cents);
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Interpreta o que a pessoa digitou e devolve centavos, ou `null` se não for um
 * valor. Vírgula é decimal e ponto é milhar ("1.234,56"). Sem vírgula, um ponto
 * seguido de 1 ou 2 dígitos no final é decimal ("12.5" → 12,50), como em valores
 * colados de extratos em inglês.
 */
export function parseMoneyInput(text: string): number | null {
  const trimmed = text.replace(/\s| /g, '').replace(/^R\$/i, '');
  if (trimmed === '') {
    return null;
  }

  let sign = 1;
  let body = trimmed;
  if (body.startsWith('-')) {
    sign = -1;
    body = body.slice(1);
  } else if (body.startsWith('+')) {
    body = body.slice(1);
  }
  body = body.replace(/^R\$/i, '');

  let integerPart: string;
  let fractionPart: string;

  if (body.includes(',')) {
    if (body.indexOf(',') !== body.lastIndexOf(',')) {
      return null;
    }
    const [integer = '', fraction = ''] = body.split(',');
    if (!/^(\d{1,3}(\.\d{3})*|\d*)$/.test(integer)) {
      return null;
    }
    integerPart = integer.replace(/\./g, '');
    fractionPart = fraction;
  } else if (/^\d+\.\d{1,2}$/.test(body)) {
    [integerPart = '', fractionPart = ''] = body.split('.');
  } else if (/^(\d{1,3}(\.\d{3})+|\d+)$/.test(body)) {
    integerPart = body.replace(/\./g, '');
    fractionPart = '';
  } else {
    return null;
  }

  if (!/^\d*$/.test(fractionPart) || fractionPart.length > 2) {
    return null;
  }
  if (integerPart === '' && fractionPart === '') {
    return null;
  }

  const cents = Number(integerPart || '0') * 100 + Number(fractionPart.padEnd(2, '0') || '0');
  if (!Number.isSafeInteger(cents)) {
    return null;
  }
  return cents === 0 ? 0 : sign * cents;
}

/** 13 dígitos = até R$ 100 bilhões; mais que isso é dedo escorregando. */
const MAX_MASK_DIGITS = 13;

export type MoneyMaskResult = { text: string; cents: number | null };

/**
 * Máscara de valor enquanto a pessoa digita, como em app de banco: os dígitos
 * entram pelos centavos ("1" → "0,01", "123" → "1,23", "123456" → "1.234,56").
 * Apagar até sobrar só zero limpa o campo. Com `allowNegative`, cada "-" digitado
 * inverte o sinal.
 */
export function maskMoneyInput(
  text: string,
  { allowNegative = false }: { allowNegative?: boolean } = {},
): MoneyMaskResult {
  const minusCount = text.split('-').length - 1;
  const negative = allowNegative && minusCount % 2 === 1;
  const rawDigits = text.replace(/\D/g, '');

  // "0" sozinho é um zero digitado; zeros que sobraram de apagar esvaziam o campo.
  if (rawDigits === '' || (/^0+$/.test(rawDigits) && rawDigits !== '0')) {
    return { text: negative ? '-' : '', cents: null };
  }

  const digits = rawDigits.replace(/^0+(?=\d)/, '').slice(0, MAX_MASK_DIGITS);
  const absolute = Number(digits);
  const cents = negative && absolute !== 0 ? -absolute : absolute;
  const formatted = formatMoneyInput(Math.abs(cents));
  return { text: negative ? `-${formatted}` : formatted, cents };
}
