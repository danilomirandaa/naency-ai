/** Calculadora do campo de valor: expressão com + − × ÷, sem `eval`. */

export type CalculatorOperator = '+' | '-' | '×' | '÷';
const OPERATORS = ['+', '-', '×', '÷'] as const;

function isOperator(value: string): value is CalculatorOperator {
  return (OPERATORS as readonly string[]).includes(value);
}

function tokenize(expression: string) {
  const normalized = expression.replace(/\s/g, '').replace(/\*/g, '×').replace(/\//g, '÷').replace(/,/g, '.');
  const tokens: (number | CalculatorOperator)[] = [];
  let number = '';
  for (const [index, char] of [...normalized].entries()) {
    const previous = tokens[tokens.length - 1];
    const unaryMinus = char === '-' && number === '' && (previous === undefined || typeof previous !== 'number');
    if (/\d|\./.test(char) || unaryMinus) {
      number += char;
      continue;
    }
    if (!isOperator(char)) {
      return null;
    }
    if (number !== '') {
      tokens.push(Number(number));
      number = '';
    } else if (index !== normalized.length - 1) {
      return null;
    }
    tokens.push(char);
  }
  if (number !== '') {
    tokens.push(Number(number));
  }
  return tokens.some((token) => typeof token === 'number' && Number.isNaN(token)) ? null : tokens;
}

/**
 * Resultado da expressão ("230+45×2" → 320), respeitando × e ÷ antes de + e −.
 * Operador sobrando no fim é ignorado. `null` se inválida ou com divisão por zero.
 */
export function evaluateExpression(expression: string): number | null {
  const tokens = tokenize(expression);
  if (!tokens || tokens.length === 0) {
    return null;
  }
  if (typeof tokens[tokens.length - 1] !== 'number') {
    tokens.pop();
  }
  // Primeiro × e ÷.
  const terms: (number | CalculatorOperator)[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] as number | CalculatorOperator;
    if (token === '×' || token === '÷') {
      const left = terms.pop();
      const right = tokens[index + 1];
      if (typeof left !== 'number' || typeof right !== 'number') {
        return null;
      }
      if (token === '÷' && right === 0) {
        return null;
      }
      terms.push(token === '×' ? left * right : left / right);
      index += 1;
    } else {
      terms.push(token);
    }
  }
  // Depois + e −.
  let result = terms[0];
  if (typeof result !== 'number') {
    return null;
  }
  for (let index = 1; index < terms.length; index += 2) {
    const operator = terms[index];
    const value = terms[index + 1];
    if (typeof value !== 'number') {
      return null;
    }
    result = operator === '+' ? result + value : result - value;
  }
  return Math.round(result * 100) / 100;
}

/** Valor em reais para mostrar na calculadora: "230", "12.5". */
export function formatCalculatorNumber(value: number) {
  return String(Math.round(value * 100) / 100);
}

export type CalculatorKey = `${number}` | '.' | CalculatorOperator | 'C' | '⌫' | '=';

/** Aplica uma tecla à expressão, evitando operadores repetidos e dois pontos no mesmo número. */
export function pressKey(expression: string, key: CalculatorKey): string {
  if (key === 'C') {
    return '';
  }
  if (key === '⌫') {
    return expression.slice(0, -1);
  }
  if (key === '=') {
    const result = evaluateExpression(expression);
    return result === null ? expression : formatCalculatorNumber(result);
  }
  const last = expression.slice(-1);
  if (isOperator(key)) {
    if (expression === '' || expression === '-') {
      return key === '-' ? '-' : expression;
    }
    return isOperator(last) ? expression.slice(0, -1) + key : expression + key;
  }
  if (key === '.') {
    const currentNumber = expression.split(/[+\-×÷]/).pop() ?? '';
    if (currentNumber.includes('.')) {
      return expression;
    }
    return expression + (currentNumber === '' ? '0.' : '.');
  }
  return expression + key;
}
