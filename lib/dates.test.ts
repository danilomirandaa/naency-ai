import { describe, expect, it } from 'vitest';
import {
  calendarDayDiff,
  formatIsoDate,
  formatRelativeDays,
  isIsoDate,
  todayIsoDate,
} from './dates';

const now = new Date('2026-09-16T15:00:00Z'); // 12:00 em São Paulo

describe('formatRelativeDays', () => {
  it.each([
    ['2026-09-16T20:00:00Z', 'hoje'],
    ['2026-09-17T12:00:00Z', 'amanhã'],
    ['2026-09-23T12:00:00Z', 'em 7 dias'],
    ['2026-09-15T12:00:00Z', 'ontem'],
    ['2026-09-13T12:00:00Z', 'há 3 dias'],
  ])('%s → %s', (target, expected) => {
    expect(formatRelativeDays(new Date(target), now)).toBe(expected);
  });
});

describe('calendarDayDiff', () => {
  it('conta dia de calendário no fuso de São Paulo, não blocos de 24h', () => {
    // 23:30 em São Paulo e 00:30 do dia seguinte em São Paulo: 1h de diferença, 1 dia de calendário.
    expect(calendarDayDiff(new Date('2026-09-17T03:30:00Z'), new Date('2026-09-17T02:30:00Z'))).toBe(1);
  });

  it('a mesma hora UTC pode ser dias diferentes em São Paulo', () => {
    // 02:00Z = 23:00 do dia anterior em São Paulo.
    expect(calendarDayDiff(new Date('2026-09-17T12:00:00Z'), new Date('2026-09-17T02:00:00Z'))).toBe(1);
  });
});

describe('isIsoDate', () => {
  it.each(['2026-09-16', '2024-02-29', '2026-12-31'])('aceita %s', (value) => {
    expect(isIsoDate(value)).toBe(true);
  });

  it.each(['2026-02-29', '2026-13-01', '2026-09-31', '16/09/2026', '2026-9-16', '', null, 20260916])(
    'rejeita %j',
    (value) => {
      expect(isIsoDate(value)).toBe(false);
    },
  );
});

describe('todayIsoDate', () => {
  it('usa o dia de São Paulo, não o de UTC', () => {
    // 01:30 UTC do dia 17 ainda é dia 16 em São Paulo.
    expect(todayIsoDate(new Date('2026-09-17T01:30:00Z'))).toBe('2026-09-16');
    expect(todayIsoDate(now)).toBe('2026-09-16');
  });
});

describe('formatIsoDate', () => {
  it('formata no padrão brasileiro sem deslocar o dia', () => {
    expect(formatIsoDate('2026-01-01')).toBe('01/01/2026');
  });

  it('lança para data inválida', () => {
    expect(() => formatIsoDate('2026-02-30')).toThrow(RangeError);
  });
});
