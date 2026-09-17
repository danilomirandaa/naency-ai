import { describe, expect, it } from 'vitest';
import { assertCents, formatMoney, formatMoneyInput, parseMoneyInput } from './money';

// Intl usa espaço não separável entre "R$" e o número.
const nbsp = (text: string) => text.replace(/ /g, ' ');

describe('formatMoney', () => {
  it.each([
    [0, 'R$ 0,00'],
    [1, 'R$ 0,01'],
    [123456, 'R$ 1.234,56'],
    [-34290, '-R$ 342,90'],
    [100000000, 'R$ 1.000.000,00'],
  ])('%i centavos → %s', (cents, expected) => {
    expect(formatMoney(cents)).toBe(nbsp(expected));
  });

  it('mostra sinal de positivo quando pedido', () => {
    expect(formatMoney(1000, { signDisplay: 'exceptZero' })).toBe(nbsp('+R$ 10,00'));
    expect(formatMoney(0, { signDisplay: 'exceptZero' })).toBe(nbsp('R$ 0,00'));
  });

  it('recusa valor que não é centavo inteiro', () => {
    expect(() => formatMoney(10.5)).toThrow(RangeError);
    expect(() => formatMoney(Number.NaN)).toThrow(RangeError);
  });
});

describe('formatMoneyInput', () => {
  it('sem símbolo e com duas casas', () => {
    expect(formatMoneyInput(123450)).toBe('1.234,50');
    expect(formatMoneyInput(5)).toBe('0,05');
  });
});

describe('parseMoneyInput', () => {
  it.each([
    ['1.234,56', 123456],
    ['1234,56', 123456],
    ['1234,5', 123450],
    ['1234', 123400],
    ['1.234', 123400],
    ['0,99', 99],
    [',5', 50],
    ['R$ 12', 1200],
    ['R$ 1.234,56', 123456],
    ['-3,40', -340],
    ['- R$ 3,40', -340],
    ['+10', 1000],
    ['12.5', 1250],
    ['12.50', 1250],
    ['1.000.000,00', 100000000],
    ['  42  ', 4200],
    ['0', 0],
    ['-0,00', 0],
  ])('%j → %i centavos', (text, cents) => {
    expect(parseMoneyInput(text)).toBe(cents);
  });

  it.each([
    '',
    '   ',
    'abc',
    '12,345',
    '1,2,3',
    '12.3456',
    '1.23.45',
    '12,3a',
    '--3',
    'R$',
    ',',
    '99999999999999999999',
  ])('%j não é valor', (text) => {
    expect(parseMoneyInput(text)).toBeNull();
  });

  it('ida e volta: formatar e interpretar dá o mesmo valor', () => {
    for (const cents of [0, 1, 99, 100, 123456, 987654321, -4550]) {
      expect(parseMoneyInput(formatMoney(cents))).toBe(cents);
      expect(parseMoneyInput(formatMoneyInput(cents))).toBe(cents);
    }
  });
});

describe('assertCents', () => {
  it('aceita inteiros seguros', () => {
    expect(() => assertCents(Number.MAX_SAFE_INTEGER)).not.toThrow();
  });

  it('recusa inteiros inseguros', () => {
    expect(() => assertCents(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});
