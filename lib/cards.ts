import { isIsoDate } from '@/lib/dates';

/** Regras de cartão de crédito (docs/domain.md). */

export type InvoicePeriod = {
  /** Mês da fatura = mês do vencimento ("2026-10"). */
  referenceMonth: string;
  closingDate: string;
  dueDate: string;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Dia no mês, limitado ao último dia (fechamento 31 em fevereiro = 28/29). */
function clampedDate(year: number, month: number, day: number) {
  const normalized = new Date(Date.UTC(year, month - 1, 1));
  const y = normalized.getUTCFullYear();
  const m = normalized.getUTCMonth() + 1;
  return `${y}-${pad(m)}-${pad(Math.min(day, daysInMonth(y, m)))}`;
}

export function assertCardDay(day: number, label: string) {
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new RangeError(`${label} inválido: ${day}`);
  }
}

/**
 * Fatura que recebe uma compra: até o dia de fechamento (inclusive), entra na
 * fatura que fecha naquele mês; depois, na do mês seguinte. O vencimento cai no
 * mês do fechamento se o dia de vencimento for depois do fechamento; senão, no
 * mês seguinte.
 */
export function invoiceForPurchase(date: string, closingDay: number, dueDay: number): InvoicePeriod {
  if (!isIsoDate(date)) {
    throw new RangeError(`Data inválida: ${date}`);
  }
  assertCardDay(closingDay, 'Dia de fechamento');
  assertCardDay(dueDay, 'Dia de vencimento');
  const [year, month] = date.split('-').map(Number) as [number, number];

  const closingThisMonth = clampedDate(year, month, closingDay);
  const closingMonthOffset = date <= closingThisMonth ? 0 : 1;
  const closingDate = clampedDate(year, month + closingMonthOffset, closingDay);
  const dueMonthOffset = closingMonthOffset + (dueDay > closingDay ? 0 : 1);
  const dueDate = clampedDate(year, month + dueMonthOffset, dueDay);
  return { referenceMonth: dueDate.slice(0, 7), closingDate, dueDate };
}

/** Mesmo dia N meses depois, limitado ao fim do mês (31/01 + 1 → 28/02). */
export function addMonthsToDate(date: string, months: number) {
  if (!isIsoDate(date)) {
    throw new RangeError(`Data inválida: ${date}`);
  }
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return clampedDate(year, month + months, day);
}

/**
 * Divide uma compra parcelada em centavos. A sobra do arredondamento vai na
 * primeira parcela (docs/domain.md), e a soma é sempre exata.
 */
export function splitInstallments(totalCents: number, count: number) {
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
    throw new RangeError(`Valor inválido: ${totalCents}`);
  }
  if (!Number.isInteger(count) || count < 1 || count > 48) {
    throw new RangeError(`Parcelas inválidas: ${count}`);
  }
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_, index) => (index === 0 ? base + remainder : base));
}

export type InvoiceStatus = 'open' | 'closed' | 'paid';

/** Status derivado: paga se tem pagamento; senão aberta até o fechamento, depois fechada. */
export function invoiceStatus(
  invoice: { closingDate: string; paidAt: Date | string | null },
  today: string,
): InvoiceStatus {
  if (invoice.paidAt) {
    return 'paid';
  }
  return today <= invoice.closingDate ? 'open' : 'closed';
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  paid: 'Paga',
};
