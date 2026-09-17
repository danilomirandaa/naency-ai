import { describe, expect, it } from 'vitest';
import { monthlyNeeded, monthsUntil } from './planning';

describe('metas', () => {
  it('meses até a data, no mínimo 1', () => {
    expect(monthsUntil('2026-09-16', '2027-09-01')).toBe(12);
    expect(monthsUntil('2026-09-16', '2026-09-30')).toBe(1);
    expect(monthsUntil('2026-09-16', '2026-01-01')).toBe(1);
  });

  it('quanto guardar por mês, arredondando para cima', () => {
    expect(monthlyNeeded(1_000_000, 400_000, '2026-09-16', '2027-09-01')).toBe(50_000);
    expect(monthlyNeeded(100, 0, '2026-09-16', '2026-12-01')).toBe(34);
    expect(monthlyNeeded(100, -50, '2026-09-16', '2026-10-01')).toBe(100);
  });

  it('sem data ou já alcançada', () => {
    expect(monthlyNeeded(100, 0, '2026-09-16', null)).toBeNull();
    expect(monthlyNeeded(100, 150, '2026-09-16', '2027-01-01')).toBeNull();
  });
});
