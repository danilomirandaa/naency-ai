import { describe, expect, it } from 'vitest';
import {
  type InvoiceStatus,
  addMonthsToDate,
  currentInvoiceOf,
  invoiceForPurchase,
  invoiceStatus,
  splitInstallments,
} from './cards';

describe('invoiceForPurchase', () => {
  it.each([
    // [compra, fechamento, vencimento, mês, fecha, vence]
    ['2026-09-02', 3, 10, '2026-09', '2026-09-03', '2026-09-10'],
    ['2026-09-03', 3, 10, '2026-09', '2026-09-03', '2026-09-10'],
    ['2026-09-04', 3, 10, '2026-10', '2026-10-03', '2026-10-10'],
    ['2026-09-20', 25, 5, '2026-10', '2026-09-25', '2026-10-05'],
    ['2026-09-26', 25, 5, '2026-11', '2026-10-25', '2026-11-05'],
    ['2026-12-28', 25, 5, '2027-02', '2027-01-25', '2027-02-05'],
    ['2026-09-10', 10, 10, '2026-10', '2026-09-10', '2026-10-10'],
  ])('compra em %s, fecha dia %i, vence dia %i → fatura %s', (date, closing, due, month, closingDate, dueDate) => {
    expect(invoiceForPurchase(date, closing, due)).toEqual({
      referenceMonth: month,
      closingDate,
      dueDate,
    });
  });

  it('fechamento no dia 31 usa o último dia de meses curtos', () => {
    expect(invoiceForPurchase('2027-02-28', 31, 8)).toEqual({
      referenceMonth: '2027-03',
      closingDate: '2027-02-28',
      dueDate: '2027-03-08',
    });
    expect(invoiceForPurchase('2027-01-31', 31, 8).closingDate).toBe('2027-01-31');
  });

  it('recusa entradas inválidas', () => {
    expect(() => invoiceForPurchase('2026-02-30', 3, 10)).toThrow(RangeError);
    expect(() => invoiceForPurchase('2026-09-01', 0, 10)).toThrow(RangeError);
    expect(() => invoiceForPurchase('2026-09-01', 3, 32)).toThrow(RangeError);
  });
});

describe('addMonthsToDate', () => {
  it('mantém o dia e limita ao fim do mês', () => {
    expect(addMonthsToDate('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsToDate('2026-11-15', 3)).toBe('2027-02-15');
    expect(addMonthsToDate('2026-09-10', 0)).toBe('2026-09-10');
    expect(() => addMonthsToDate('x', 1)).toThrow(RangeError);
  });
});

describe('splitInstallments', () => {
  it('sobra do arredondamento na primeira parcela e soma exata', () => {
    expect(splitInstallments(100_00, 3)).toEqual([33_34, 33_33, 33_33]);
    expect(splitInstallments(10, 4)).toEqual([4, 2, 2, 2]);
    for (const [total, count] of [
      [99_999, 7],
      [1, 1],
      [123_456_78, 48],
    ] as const) {
      expect(splitInstallments(total, count).reduce((sum, value) => sum + value, 0)).toBe(total);
    }
  });

  it.each([
    [0, 2],
    [100, 0],
    [100, 49],
    [1.5, 2],
  ])('recusa total %s em %s parcelas', (total, count) => {
    expect(() => splitInstallments(total, count)).toThrow(RangeError);
  });
});

describe('invoiceStatus', () => {
  it('aberta até o fechamento, fechada depois, paga com pagamento', () => {
    const invoice = { closingDate: '2026-09-25', paidAt: null };
    expect(invoiceStatus(invoice, '2026-09-25')).toBe('open');
    expect(invoiceStatus(invoice, '2026-09-26')).toBe('closed');
    expect(invoiceStatus({ ...invoice, paidAt: new Date() }, '2026-09-01')).toBe('paid');
  });
});

describe('currentInvoiceOf', () => {
  const invoice = (referenceMonth: string, status: InvoiceStatus, dueDate: string) => ({ referenceMonth, status, dueDate });
  // Lista como vem do DAL: da mais recente para a mais antiga.
  const list = [
    invoice('2026-10', 'open', '2026-10-05'),
    invoice('2026-09', 'closed', '2026-09-05'),
    invoice('2026-01', 'closed', '2026-01-05'),
  ];

  it('abre na fatura atual, mesmo com faturas antigas em aberto', () => {
    expect(currentInvoiceOf(list, '2026-09-17')?.referenceMonth).toBe('2026-10');
  });

  it('sem fatura atual, abre na mais recente', () => {
    expect(currentInvoiceOf([invoice('2026-09', 'paid', '2026-09-05')], '2026-09-17')?.referenceMonth).toBe('2026-09');
    expect(currentInvoiceOf(list, '2026-12-01')?.referenceMonth).toBe('2026-10');
    expect(currentInvoiceOf([], '2026-09-17')).toBeUndefined();
  });
});
