import { describe, expect, it } from 'vitest';
import {
  assertCents,
  formatMoney,
  formatMoneyCompact,
  formatMoneyInput,
  maskMoneyInput,
  parseMoneyInput,
} from './money';

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

describe('formatMoneyCompact', () => {
  it.each([
    [0, 'R$ 0'],
    [99_900, 'R$ 999'],
    [240_000, 'R$ 2,4 mil'],
    [-240_000, '-R$ 2,4 mil'],
    [120_000_000, 'R$ 1,2 mi'],
  ])('%i centavos → %s', (cents, expected) => {
    expect(formatMoneyCompact(cents)).toBe(nbsp(expected));
  });

  it('recusa valor que não é centavo inteiro', () => {
    expect(() => formatMoneyCompact(10.5)).toThrow(RangeError);
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

describe('maskMoneyInput', () => {
  /** Simula digitar caractere por caractere, como o campo faz a cada tecla. */
  function typeInto(keys: string, options?: { allowNegative?: boolean }) {
    let text = '';
    let cents: number | null = null;
    for (const key of keys) {
      ({ text, cents } = maskMoneyInput(text + key, options));
    }
    return { text, cents };
  }

  it.each([
    ['1', '0,01', 1],
    ['12', '0,12', 12],
    ['123', '1,23', 123],
    ['123456', '1.234,56', 123456],
    ['100000000', '1.000.000,00', 100000000],
    ['0', '0,00', 0],
    ['0012', '0,12', 12],
  ])('digitar %s → %s', (keys, text, cents) => {
    expect(typeInto(keys)).toEqual({ text, cents });
  });

  it('ignora letras, vírgula, ponto e símbolo', () => {
    expect(typeInto('R$ 1a2,3.4')).toEqual({ text: '12,34', cents: 1234 });
  });

  it('apagar o último dígito desloca para a direita', () => {
    expect(maskMoneyInput('1.234,5')).toEqual({ text: '123,45', cents: 12345 });
  });

  it('apagar até sobrar zero limpa o campo', () => {
    expect(maskMoneyInput('0,0')).toEqual({ text: '', cents: null });
    expect(maskMoneyInput('')).toEqual({ text: '', cents: null });
  });

  it('sem allowNegative, "-" é ignorado', () => {
    expect(typeInto('-150')).toEqual({ text: '1,50', cents: 150 });
  });

  it('com allowNegative, "-" inverte o sinal a cada vez', () => {
    const options = { allowNegative: true };
    expect(typeInto('-150', options)).toEqual({ text: '-1,50', cents: -150 });
    expect(typeInto('150-', options)).toEqual({ text: '-1,50', cents: -150 });
    expect(typeInto('-150-', options)).toEqual({ text: '1,50', cents: 150 });
    expect(maskMoneyInput('-', options)).toEqual({ text: '-', cents: null });
  });

  it('negativo de zero é zero', () => {
    expect(maskMoneyInput('-0', { allowNegative: true })).toEqual({ text: '-0,00', cents: 0 });
  });

  it('limita a 13 dígitos (R$ 100 bilhões)', () => {
    expect(typeInto('12345678901234567').cents).toBe(1234567890123);
  });
});
