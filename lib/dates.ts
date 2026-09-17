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
