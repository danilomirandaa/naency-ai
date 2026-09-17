import { describe, expect, it } from 'vitest';
import { evaluateExpression, formatCalculatorNumber, pressKey } from './calculator';

describe('evaluateExpression', () => {
  it.each([
    ['230', 230],
    ['230+45×2', 320],
    ['100÷3', 33.33],
    ['10-2-3', 5],
    ['-5+10', 5],
    ['2*3/4', 1.5],
    ['12,5+0,5', 13],
    ['0.1+0.2', 0.3],
    ['230+', 230],
  ])('%s = %s', (expression, result) => {
    expect(evaluateExpression(expression)).toBe(result);
  });

  it.each(['', '5÷0', '2++2', 'abc', '1..2', '×3'])('inválida: %j', (expression) => {
    expect(evaluateExpression(expression)).toBeNull();
  });
});

describe('pressKey', () => {
  function type(keys: string[]) {
    return keys.reduce((expression, key) => pressKey(expression, key as never), '');
  }

  it('monta a expressão e calcula no =', () => {
    expect(type(['2', '0', '0', '+', '3', '0', '='])).toBe('230');
  });

  it('troca operador repetido e evita dois pontos no mesmo número', () => {
    expect(type(['5', '+', '×', '2'])).toBe('5×2');
    expect(type(['1', '.', '5', '.', '5'])).toBe('1.55');
    expect(type(['.', '5'])).toBe('0.5');
    expect(type(['3', '+', '.', '2'])).toBe('3+0.2');
  });

  it('começa com menos, apaga e limpa', () => {
    expect(type(['×'])).toBe('');
    expect(type(['-', '5'])).toBe('-5');
    expect(type(['1', '2', '⌫'])).toBe('1');
    expect(type(['1', '2', 'C'])).toBe('');
  });

  it('= com expressão inválida mantém o que foi digitado', () => {
    expect(type(['5', '÷', '0', '='])).toBe('5÷0');
  });

  it('formata sem zeros à direita', () => {
    expect(formatCalculatorNumber(230)).toBe('230');
    expect(formatCalculatorNumber(12.5)).toBe('12.5');
  });
});
