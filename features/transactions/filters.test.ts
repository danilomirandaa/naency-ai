import { describe, expect, it } from 'vitest';
import { filtersFromSearchParams, filtersToSearchParams } from './filters';

const now = new Date('2026-09-16T15:00:00Z');
const uuid = '11111111-1111-4111-8111-111111111111';

describe('filtersFromSearchParams', () => {
  it('sem parâmetros usa o mês atual e nada filtrado', () => {
    expect(filtersFromSearchParams(new URLSearchParams(), { now })).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
      accountId: null,
      categoryId: null,
      kind: null,
      search: '',
      page: 1,
      invoiceId: null,
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
      from: '2026-08-01',
      to: '2026-08-31',
      accountId: uuid,
      categoryId: uuid,
      kind: 'expense',
      search: 'padaria',
      page: 3,
      invoiceId: null,
    });
  });

  it('valores inválidos voltam ao padrão', () => {
    const params = new URLSearchParams({ mes: '2026-13', conta: 'x', tipo: 'outros', pagina: '-2' });
    expect(filtersFromSearchParams(params, { now })).toMatchObject({
      from: '2026-09-01',
      to: '2026-09-30',
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
  it('período sempre explícito, resto só fora do padrão, e ida e volta', () => {
    const filters = filtersFromSearchParams(
      new URLSearchParams({ mes: '2026-08', tipo: 'transferencias', busca: 'pix', pagina: '2' }),
      { now },
    );
    const params = filtersToSearchParams(filters);
    expect(params.toString()).toBe('mes=2026-08&tipo=transferencias&busca=pix&pagina=2');
    expect(filtersFromSearchParams(params, { now })).toEqual(filters);
    expect(
      filtersToSearchParams({ ...filters, from: '2026-09-01', to: '2026-09-30', page: 1, search: '', kind: null }).toString(),
    ).toBe('mes=2026-09');
    expect(filtersToSearchParams(filters, { omitKind: true }).has('tipo')).toBe(false);
  });
});

describe('intervalo personalizado', () => {
  it('lê ?de=&ate= e grava de volta; intervalo inválido cai no mês', () => {
    const custom = filtersFromSearchParams(new URLSearchParams({ de: '2026-09-01', ate: '2026-09-15', mes: '2026-01' }), { now });
    expect(custom).toMatchObject({ from: '2026-09-01', to: '2026-09-15' });
    expect(filtersToSearchParams(custom).toString()).toBe('de=2026-09-01&ate=2026-09-15');

    // Sem período na URL, vale o cookie do header.
    const fromCookie = filtersFromSearchParams(new URLSearchParams(), { now, periodCookie: '2026-09-13_2026-09-19' });
    expect(fromCookie).toMatchObject({ from: '2026-09-13', to: '2026-09-19' });

    const inverted = filtersFromSearchParams(new URLSearchParams({ de: '2026-09-15', ate: '2026-09-01' }), { now });
    expect(inverted).toMatchObject({ from: '2026-09-01', to: '2026-09-30' });
  });
});
