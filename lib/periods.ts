import { formatIsoDate, formatMonth, isIsoDate, monthRange } from '@/lib/dates';

/** Intervalo de datas de calendário, inclusive ("AAAA-MM-DD"). */
export type DateRange = { from: string; to: string };

export const PERIOD_PRESETS = [
  'today',
  'yesterday',
  'this_week',
  'last_week',
  'this_month',
  'last_month',
  'this_year',
] as const;
export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  this_week: 'Esta semana',
  last_week: 'Semana passada',
  this_month: 'Este mês',
  last_month: 'Mês passado',
  this_year: 'Este ano',
};

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function weekday(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** Intervalo de um atalho a partir de hoje. A semana começa no domingo. */
export function presetRange(preset: PeriodPreset, today: string): DateRange {
  const month = today.slice(0, 7);
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday': {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case 'this_week': {
      const from = addDays(today, -weekday(today));
      return { from, to: addDays(from, 6) };
    }
    case 'last_week': {
      const from = addDays(today, -weekday(today) - 7);
      return { from, to: addDays(from, 6) };
    }
    case 'this_month':
      return monthRange(month);
    case 'last_month':
      return monthRange(shiftMonthOf(month, -1));
    case 'this_year':
      return { from: `${today.slice(0, 4)}-01-01`, to: `${today.slice(0, 4)}-12-31` };
  }
}

function shiftMonthOf(month: string, delta: number) {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number];
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Atalho que corresponde ao intervalo, se houver. */
export function detectPreset(range: DateRange, today: string): PeriodPreset | null {
  return (
    PERIOD_PRESETS.find((preset) => {
      const candidate = presetRange(preset, today);
      return candidate.from === range.from && candidate.to === range.to;
    }) ?? null
  );
}

/** Mês ("AAAA-MM") quando o intervalo é exatamente um mês inteiro. */
export function wholeMonthOf(range: DateRange) {
  const month = range.from.slice(0, 7);
  const full = monthRange(month);
  return full.from === range.from && full.to === range.to ? month : null;
}

/** Desloca um mês inteiro (ou o mês de início) em `delta` meses, sempre como mês inteiro. */
export function shiftRangeByMonths(range: DateRange, delta: number): DateRange {
  return monthRange(shiftMonthOf(range.from.slice(0, 7), delta));
}

/** "Setembro de 2026", "16/09/2026" ou "01/09 – 15/09/2026". */
export function formatRange(range: DateRange) {
  const month = wholeMonthOf(range);
  if (month) {
    return formatMonth(month);
  }
  if (range.from === range.to) {
    return formatIsoDate(range.from);
  }
  const sameYear = range.from.slice(0, 4) === range.to.slice(0, 4);
  const from = formatIsoDate(range.from);
  return `${sameYear ? from.slice(0, 5) : from} – ${formatIsoDate(range.to)}`;
}

/** Intervalo válido: duas datas reais, com início até o fim, e no máximo 5 anos. */
export function isValidRange(range: { from: unknown; to: unknown }): range is DateRange {
  if (!isIsoDate(range.from) || !isIsoDate(range.to) || range.from > range.to) {
    return false;
  }
  const days = (Date.parse(`${range.to}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / 86_400_000;
  return days <= 366 * 5;
}

/** Período anterior de mesmo tamanho (mês inteiro → mês anterior inteiro). */
export function previousRange(range: DateRange): DateRange {
  if (wholeMonthOf(range)) {
    return shiftRangeByMonths(range, -1);
  }
  const days = (Date.parse(`${range.to}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / 86_400_000;
  const to = addDays(range.from, -1);
  return { from: addDays(to, -days), to };
}
