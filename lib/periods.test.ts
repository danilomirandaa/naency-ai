import { describe, expect, it } from 'vitest';
import {
  detectPreset,
  isPeriodPath,
  parseRangeCookie,
  rangeParams,
  resolveRange,
  serializeRange,
  formatRange,
  isValidRange,
  presetRange,
  previousRange,
  shiftRangeByMonths,
  wholeMonthOf,
} from './periods';

// 16/09/2026 é quarta-feira.
const TODAY = '2026-09-16';

describe('presetRange', () => {
  it.each([
    ['today', '2026-09-16', '2026-09-16'],
    ['yesterday', '2026-09-15', '2026-09-15'],
    ['this_week', '2026-09-13', '2026-09-19'],
    ['last_week', '2026-09-06', '2026-09-12'],
    ['this_month', '2026-09-01', '2026-09-30'],
    ['last_month', '2026-08-01', '2026-08-31'],
    ['this_year', '2026-01-01', '2026-12-31'],
  ] as const)('%s', (preset, from, to) => {
    expect(presetRange(preset, TODAY)).toEqual({ from, to });
  });

  it('mês passado atravessa o ano e semana começa no domingo', () => {
    expect(presetRange('last_month', '2026-01-10')).toEqual({ from: '2025-12-01', to: '2025-12-31' });
    expect(presetRange('this_week', '2026-09-13')).toEqual({ from: '2026-09-13', to: '2026-09-19' });
  });
});

describe('detectPreset e wholeMonthOf', () => {
  it('reconhece atalhos e meses inteiros', () => {
    expect(detectPreset({ from: '2026-09-01', to: '2026-09-30' }, TODAY)).toBe('this_month');
    expect(detectPreset({ from: '2026-09-02', to: '2026-09-30' }, TODAY)).toBeNull();
    expect(wholeMonthOf({ from: '2024-02-01', to: '2024-02-29' })).toBe('2024-02');
    expect(wholeMonthOf({ from: '2024-02-01', to: '2024-02-28' })).toBeNull();
  });
});

describe('navegação e texto', () => {
  it('desloca por meses inteiros', () => {
    expect(shiftRangeByMonths({ from: '2026-09-10', to: '2026-09-12' }, -1)).toEqual({ from: '2026-08-01', to: '2026-08-31' });
    expect(shiftRangeByMonths({ from: '2026-09-01', to: '2026-09-30' }, 12)).toEqual({ from: '2027-09-01', to: '2027-09-30' });
  });

  it.each([
    [{ from: '2026-09-01', to: '2026-09-30' }, 'Setembro de 2026'],
    [{ from: '2026-09-16', to: '2026-09-16' }, '16/09/2026'],
    [{ from: '2026-09-01', to: '2026-09-15' }, '01/09 – 15/09/2026'],
    [{ from: '2025-12-20', to: '2026-01-05' }, '20/12/2025 – 05/01/2026'],
  ])('formata %j', (range, text) => {
    expect(formatRange(range)).toBe(text);
  });

  it('período anterior de mesmo tamanho', () => {
    expect(previousRange({ from: '2026-09-01', to: '2026-09-30' })).toEqual({ from: '2026-08-01', to: '2026-08-31' });
    expect(previousRange({ from: '2026-09-11', to: '2026-09-20' })).toEqual({ from: '2026-09-01', to: '2026-09-10' });
  });

  it('valida intervalo', () => {
    expect(isValidRange({ from: '2026-09-01', to: '2026-09-30' })).toBe(true);
    expect(isValidRange({ from: '2026-09-30', to: '2026-09-01' })).toBe(false);
    expect(isValidRange({ from: '2020-01-01', to: '2026-09-01' })).toBe(false);
    expect(isValidRange({ from: 'x', to: '2026-09-01' })).toBe(false);
  });
});

describe('período global', () => {
  const now = new Date('2026-09-16T15:00:00Z');
  const params = (values: Record<string, string>) => new URLSearchParams(values);

  it('URL vence cookie, que vence o mês atual', () => {
    const cookie = serializeRange({ from: '2026-01-01', to: '2026-01-31' });
    expect(resolveRange(params({ de: '2026-09-01', ate: '2026-09-15' }), cookie, now)).toEqual({ from: '2026-09-01', to: '2026-09-15' });
    expect(resolveRange(params({ mes: '2026-08' }), cookie, now)).toEqual({ from: '2026-08-01', to: '2026-08-31' });
    expect(resolveRange(params({}), cookie, now)).toEqual({ from: '2026-01-01', to: '2026-01-31' });
    expect(resolveRange(params({}), 'lixo', now)).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(resolveRange(params({ de: '2026-09-15', ate: '2026-09-01' }), null, now)).toEqual({ from: '2026-09-01', to: '2026-09-30' });
  });

  it('cookie ida e volta e parâmetros curtos', () => {
    expect(parseRangeCookie(serializeRange({ from: '2026-09-13', to: '2026-09-19' }))).toEqual({ from: '2026-09-13', to: '2026-09-19' });
    expect(parseRangeCookie(undefined)).toBeNull();
    expect(rangeParams({ from: '2026-09-01', to: '2026-09-30' })).toEqual({ mes: '2026-09' });
    expect(rangeParams({ from: '2026-09-13', to: '2026-09-19' })).toEqual({ de: '2026-09-13', ate: '2026-09-19' });
  });

  it('rotas com período', () => {
    for (const path of ['/', '/transacoes', '/transacoes/despesas', '/relatorios', '/planejamento/orcamentos']) {
      expect(isPeriodPath(path)).toBe(true);
    }
    for (const path of ['/contas', '/transacoes/recorrentes', '/cartoes', '/categorias']) {
      expect(isPeriodPath(path)).toBe(false);
    }
  });
});
