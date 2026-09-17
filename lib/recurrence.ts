import { addMonthsToDate } from '@/lib/cards';
import { isIsoDate } from '@/lib/dates';

export const RECURRENCE_FREQUENCIES = ['monthly', 'weekly', 'yearly'] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  monthly: 'Todo mês',
  weekly: 'Toda semana',
  yearly: 'Todo ano',
};

export type RecurrenceSchedule = {
  frequency: RecurrenceFrequency;
  /** Primeira ocorrência ("AAAA-MM-DD"); define o dia do mês, da semana ou do ano. */
  startDate: string;
  /** Última data possível, inclusive. */
  endDate: string | null;
};

/** Data da n-ésima ocorrência (0 = a primeira). Mensal e anual mantêm o dia, limitado ao fim do mês. */
export function occurrenceDate(schedule: RecurrenceSchedule, index: number) {
  if (!isIsoDate(schedule.startDate)) {
    throw new RangeError(`Data inválida: ${schedule.startDate}`);
  }
  if (schedule.frequency === 'weekly') {
    const date = new Date(`${schedule.startDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 7 * index);
    return date.toISOString().slice(0, 10);
  }
  return addMonthsToDate(schedule.startDate, schedule.frequency === 'monthly' ? index : 12 * index);
}

/** Ocorrências entre `from` e `until` (inclusive), respeitando início e fim. Limite de segurança de 500. */
export function occurrencesBetween(schedule: RecurrenceSchedule, from: string, until: string) {
  const dates: string[] = [];
  for (let index = 0; index < 500; index += 1) {
    const date = occurrenceDate(schedule, index);
    if (date > until || (schedule.endDate && date > schedule.endDate)) {
      break;
    }
    if (date >= from) {
      dates.push(date);
    }
  }
  return dates;
}

/** Próxima ocorrência a partir de hoje, ou `null` se a recorrência já terminou. */
export function nextOccurrence(schedule: RecurrenceSchedule, today: string) {
  const far = addMonthsToDate(today, 13);
  return occurrencesBetween(schedule, today, far)[0] ?? null;
}
