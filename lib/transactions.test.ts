import { describe, expect, it } from 'vitest';
import {
  inferPaymentMethod,
  normalizeDescription,
  signedAmount,
  situationLabel,
  transactionSituation,
} from './transactions';

describe('signedAmount', () => {
  it('receita positiva, despesa negativa', () => {
    expect(signedAmount('income', 1500)).toBe(1500);
    expect(signedAmount('expense', 1500)).toBe(-1500);
  });

  it.each([0, -1, 1.5, Number.NaN])('recusa %s', (value) => {
    expect(() => signedAmount('expense', value)).toThrow(RangeError);
  });
});

describe('normalizeDescription', () => {
  it('tira acentos, caixa e espaços extras', () => {
    expect(normalizeDescription('  Padaria   São  JOÃO ')).toBe('padaria sao joao');
  });
});

describe('transactionSituation', () => {
  it('efetivado é pago; previsto vence depois de hoje, atrasa antes', () => {
    expect(transactionSituation('cleared', '2026-09-01', '2026-09-17')).toBe('paid');
    expect(transactionSituation('planned', '2026-09-17', '2026-09-17')).toBe('pending');
    expect(transactionSituation('planned', '2026-09-30', '2026-09-17')).toBe('pending');
    expect(transactionSituation('planned', '2026-09-16', '2026-09-17')).toBe('overdue');
  });

  it('rótulo segue o tipo', () => {
    expect(situationLabel('pending', 'expense')).toBe('A pagar');
    expect(situationLabel('paid', 'expense')).toBe('Paga');
    expect(situationLabel('pending', 'income')).toBe('A receber');
    expect(situationLabel('paid', 'income')).toBe('Recebida');
    expect(situationLabel('pending', 'transfer')).toBe('Prevista');
    expect(situationLabel('paid', 'transfer')).toBe('Efetivada');
    expect(situationLabel('overdue', 'income')).toBe('Atrasada');
  });
});

describe('inferPaymentMethod', () => {
  it.each([
    ['COMPRA QUALQUER', 'credit_card', 'credit_card'],
    ['PIX ENVIADO JOSE DA SILVA', 'checking', 'pix'],
    ['Transferência enviada pelo Pix', 'checking', 'pix'],
    ['PAGAMENTO DE BOLETO CONDOMINIO', 'checking', 'boleto'],
    ['PAGTO TITULO UNIMED', 'checking', 'boleto'],
    ['TED 341 FULANO', 'checking', 'bank_transfer'],
    ['SAQUE 24H', 'checking', 'cash'],
    ['COMPRA DEBITO PADARIA', 'checking', 'debit_card'],
    ['RENDIMENTO POUPANCA', 'savings', null],
    ['PIXEL STUDIO', 'checking', null],
  ])('%s em %s → %s', (description, accountType, expected) => {
    expect(inferPaymentMethod(description, accountType)).toBe(expected);
  });
});
