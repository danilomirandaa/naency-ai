import { describe, expect, it } from 'vitest';
import { contrastRatio, isHexColor, readableTextColor } from './color';

describe('isHexColor', () => {
  it.each(['#820AD1', '#ffffff', '#000000'])('aceita %s', (value) => {
    expect(isHexColor(value)).toBe(true);
  });

  it.each(['820AD1', '#fff', '#GGGGGG', 'red', null])('rejeita %j', (value) => {
    expect(isHexColor(value)).toBe(false);
  });
});

describe('contrastRatio', () => {
  it('preto e branco têm 21:1, em qualquer ordem', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21);
  });
});

describe('readableTextColor', () => {
  it.each([
    ['#820AD1', '#ffffff'], // Nubank
    ['#FF7A00', '#000000'], // Inter
    ['#FCFC30', '#000000'], // Banco do Brasil
    ['#EC0000', '#ffffff'], // Santander
  ])('%s → %s', (background, expected) => {
    expect(readableTextColor(background)).toBe(expected);
  });

  it('sempre passa de 4,5:1', () => {
    for (let gray = 0; gray <= 255; gray += 5) {
      const hex = `#${gray.toString(16).padStart(2, '0').repeat(3)}`;
      expect(contrastRatio(hex, readableTextColor(hex))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('lança para cor inválida', () => {
    expect(() => readableTextColor('red')).toThrow(RangeError);
  });
});
