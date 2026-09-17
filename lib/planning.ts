/** Meses inteiros de hoje até a data (mínimo 1), para dividir o que falta da meta. */
export function monthsUntil(today: string, targetDate: string) {
  const [ty, tm] = today.split('-').map(Number) as [number, number];
  const [gy, gm] = targetDate.split('-').map(Number) as [number, number];
  return Math.max(1, (gy - ty) * 12 + (gm - tm));
}

/** Quanto guardar por mês; `null` sem data ou com a meta já alcançada. */
export function monthlyNeeded(targetCents: number, savedCents: number, today: string, targetDate: string | null) {
  const missing = targetCents - Math.max(savedCents, 0);
  if (!targetDate || missing <= 0) {
    return null;
  }
  return Math.ceil(missing / monthsUntil(today, targetDate));
}
