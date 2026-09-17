import { describe, expect, it } from 'vitest';
import { filtersFromSearchParams, filtersToSearchParams } from './filters';

const now = new Date('2026-09-16T15:00:00Z');
const uuid = '11111111-1111-4111-8111-111111111111';

describe('filtersFromSearchParams', () => {
  it('sem parâmetros usa o mês atual e nada filtrado', () => {
    expect(filtersFromSearchParams(new URLSearchParams(), { now })).toEqual({
      month: '2026-09',
      accountId: null,
      categoryId: null,
      kind: null,
      search: '',
      page: 1,
    });
  });

  it('lê todos os filtros em pt-BR', () => {
    const params = new URLSearchParams({
      mes: '2026-08',
      conta: uuid,
      categoria: uuid,
      tipo: 'despesas',
      busca: '  padaria ',
      pagina: '3',
    });
    expect(filtersFromSearchParams(params, { now })).toEqual({
      month: '2026-08',
      accountId: uuid,
      categoryId: uuid,
      kind: 'expense',
      search: 'padaria',
      page: 3,
    });
  });

  it('valores inválidos voltam ao padrão', () => {
    const params = new URLSearchParams({ mes: '2026-13', conta: 'x', tipo: 'outros', pagina: '-2' });
    expect(filtersFromSearchParams(params, { now })).toMatchObject({
      month: '2026-09',
      accountId: null,
      kind: null,
      page: 1,
    });
  });

  it('o tipo da rota (/transacoes/receitas) vence o da URL', () => {
    const params = new URLSearchParams({ tipo: 'despesas' });
    expect(filtersFromSearchParams(params, { now, kind: 'income' }).kind).toBe('income');
  });
});

describe('filtersToSearchParams', () => {
  it('omite padrões e faz ida e volta', () => {
    const filters = filtersFromSearchParams(
      new URLSearchParams({ mes: '2026-08', tipo: 'transferencias', busca: 'pix', pagina: '2' }),
      { now },
    );
    const params = filtersToSearchParams(filters, { now });
    expect(params.toString()).toBe('mes=2026-08&tipo=transferencias&busca=pix&pagina=2');
    expect(filtersFromSearchParams(params, { now })).toEqual(filters);
    expect(filtersToSearchParams({ ...filters, month: '2026-09', page: 1, search: '', kind: null }, { now }).toString()).toBe('');
    expect(filtersToSearchParams(filters, { now, omitKind: true }).has('tipo')).toBe(false);
  });
});
