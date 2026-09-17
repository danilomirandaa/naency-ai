import { describe, expect, it } from 'vitest';
import { nextOccurrence, occurrenceDate, occurrencesBetween } from './recurrence';

describe('occurrenceDate', () => {
  it('mensal mantém o dia e limita ao fim do mês', () => {
    const schedule = { frequency: 'monthly' as const, startDate: '2026-01-31', endDate: null };
    expect([0, 1, 2, 3].map((index) => occurrenceDate(schedule, index))).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ]);
  });

  it('semanal soma 7 dias atravessando o mês', () => {
    const schedule = { frequency: 'weekly' as const, startDate: '2026-09-28', endDate: null };
    expect(occurrenceDate(schedule, 1)).toBe('2026-10-05');
  });

  it('anual em 29 de fevereiro cai em 28 nos anos comuns', () => {
    const schedule = { frequency: 'yearly' as const, startDate: '2024-02-29', endDate: null };
    expect([1, 4].map((index) => occurrenceDate(schedule, index))).toEqual(['2025-02-28', '2028-02-29']);
  });

  it('recusa data inválida', () => {
    expect(() => occurrenceDate({ frequency: 'monthly', startDate: 'x', endDate: null }, 0)).toThrow(RangeError);
  });
});

describe('occurrencesBetween e nextOccurrence', () => {
  const rent = { frequency: 'monthly' as const, startDate: '2026-06-10', endDate: '2026-11-10' };

  it('só as do intervalo, sem passar do fim', () => {
    expect(occurrencesBetween(rent, '2026-09-01', '2026-12-31')).toEqual(['2026-09-10', '2026-10-10', '2026-11-10']);
  });

  it('antes do início não gera nada', () => {
    expect(occurrencesBetween(rent, '2026-01-01', '2026-05-31')).toEqual([]);
  });

  it('próxima a partir de hoje; nula depois do fim', () => {
    expect(nextOccurrence(rent, '2026-09-10')).toBe('2026-09-10');
    expect(nextOccurrence(rent, '2026-09-11')).toBe('2026-10-10');
    expect(nextOccurrence(rent, '2026-11-11')).toBeNull();
  });
});
