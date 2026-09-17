import { describe, expect, it } from 'vitest';
import { getBreadcrumb, isActivePath } from './navigation';

describe('isActivePath', () => {
  it('a raiz só é ativa na própria raiz', () => {
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/transacoes', '/')).toBe(false);
  });

  it('item é ativo na própria rota e nas rotas filhas', () => {
    expect(isActivePath('/transacoes', '/transacoes')).toBe(true);
    expect(isActivePath('/transacoes/receitas', '/transacoes')).toBe(true);
  });

  it('prefixo parcial não conta como rota filha', () => {
    expect(isActivePath('/transacoes-antigas', '/transacoes')).toBe(false);
  });
});

describe('getBreadcrumb', () => {
  it('rota de primeiro nível gera um item', () => {
    expect(getBreadcrumb('/')).toEqual([{ title: 'Visão geral', url: '/' }]);
    expect(getBreadcrumb('/cartoes')).toEqual([{ title: 'Cartões', url: '/cartoes' }]);
  });

  it('subitem gera pai e filho', () => {
    expect(getBreadcrumb('/transacoes/receitas')).toEqual([
      { title: 'Transações', url: '/transacoes' },
      { title: 'Receitas', url: '/transacoes/receitas' },
    ]);
  });

  it('subitem que aponta para a rota do pai não duplica o pai', () => {
    expect(getBreadcrumb('/transacoes')).toEqual([
      { title: 'Transações', url: '/transacoes' },
    ]);
  });

  it('páginas fora do menu também geram trilha', () => {
    expect(getBreadcrumb('/contas')).toEqual([{ title: 'Contas', url: '/contas' }]);
  });

  it('membros fica na navegação secundária', () => {
    expect(getBreadcrumb('/membros')).toEqual([{ title: 'Membros', url: '/membros' }]);
  });

  it('inclui a navegação secundária', () => {
    expect(getBreadcrumb('/configuracoes')).toEqual([
      { title: 'Configurações', url: '/configuracoes' },
    ]);
  });

  it('rota desconhecida gera trilha vazia', () => {
    expect(getBreadcrumb('/nao-existe')).toEqual([]);
  });
});
