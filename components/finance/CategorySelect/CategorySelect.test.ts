import { describe, expect, it } from 'vitest';
import { filterCategories } from '.';

describe('filterCategories', () => {
  it('ignora o id e os acentos', () => {
    expect(filterCategories('abc123|Padaria e café', 'cafe')).toBeGreaterThan(0);
    expect(filterCategories('abc123|Padaria e café', 'abc')).toBe(0);
  });

  it('nome começando com a busca vem antes; categoria principal acha as subcategorias', () => {
    expect(filterCategories('id|Netflix', 'net')).toBe(1);
    expect(filterCategories('id|Internet', 'net')).toBe(0.8);
    expect(filterCategories('id|Aluguel', 'moradia', ['Moradia'])).toBe(0.5);
    expect(filterCategories('id|Aluguel', '')).toBe(1);
  });
});
