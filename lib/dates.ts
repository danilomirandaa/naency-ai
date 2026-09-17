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
