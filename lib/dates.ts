/** Fuso de negócio do Naency (docs/architecture.md). */
export const BUSINESS_TIME_ZONE = 'America/Sao_Paulo';

const DAY_MS = 24 * 60 * 60 * 1000;

const relativeFormatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

/**
 * Distância em dias de calendário no fuso de São Paulo, em linguagem natural:
 * "hoje", "amanhã", "em 6 dias", "ontem", "há 2 dias".
 */
export function formatRelativeDays(target: Date, now: Date) {
  return relativeFormatter.format(calendarDayDiff(target, now), 'day');
}

/** Diferença em dias de calendário (não em múltiplos de 24h) no fuso de negócio. */
export function calendarDayDiff(target: Date, now: Date) {
  return Math.round((dayStart(target) - dayStart(now)) / DAY_MS);
}

function dayStart(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return Date.parse(`${parts}T00:00:00Z`);
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-09-16" que existe no calendário (rejeita 2026-02-30). */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const match = ISO_DATE.exec(value);
  if (!match) {
    return false;
  }
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Data de hoje ("2026-09-16") no fuso de negócio. */
export function todayIsoDate(now: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** "2026-09-16" → "16/09/2026". Datas de calendário não passam por fuso. */
export function formatIsoDate(value: string) {
  if (!isIsoDate(value)) {
    throw new RangeError(`Data inválida: ${value}`);
  }
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/** "2026-09-16" → Date à meia-noite local (o que o calendário usa). */
export function isoDateToLocalDate(value: string) {
  if (!isIsoDate(value)) {
    throw new RangeError(`Data inválida: ${value}`);
  }
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  return new Date(year, month - 1, day);
}

/** Date do calendário → "2026-09-16", pelos campos locais (sem converter fuso). */
export function localDateToIsoDate(date: Date) {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** "2026-09" válido. */
export function isMonth(value: unknown): value is string {
  return typeof value === 'string' && MONTH.test(value);
}

/** Mês atual ("2026-09") no fuso de negócio. */
export function currentMonth(now: Date = new Date()) {
  return todayIsoDate(now).slice(0, 7);
}

/** Primeiro e último dia do mês: "2026-02" → 2026-02-01 a 2026-02-28. */
export function monthRange(month: string) {
  if (!isMonth(month)) {
    throw new RangeError(`Mês inválido: ${month}`);
  }
  const [year, monthNumber] = month.split('-').map(Number) as [number, number];
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, '0')}` };
}

/** "2026-01" com -1 → "2025-12". */
export function shiftMonth(month: string, delta: number) {
  if (!isMonth(month)) {
    throw new RangeError(`Mês inválido: ${month}`);
  }
  const [year, monthNumber] = month.split('-').map(Number) as [number, number];
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2026-09" → "Setembro de 2026". */
export function formatMonth(month: string) {
  const { from } = monthRange(month);
  const text = monthFormatter.format(new Date(`${from}T00:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const dayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

/** "2026-09-16" → "Quarta-feira, 16 de setembro". */
export function formatDayHeading(value: string) {
  if (!isIsoDate(value)) {
    throw new RangeError(`Data inválida: ${value}`);
  }
  const text = dayFormatter.format(new Date(`${value}T00:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}
