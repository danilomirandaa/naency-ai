import type { Icons } from '@/components/ui/Icon';

export type NavLink = {
  title: string;
  url: string;
};

export type NavSubItem = NavLink & {
  icon: Icons;
};

export type NavItem = NavLink & {
  icon: Icons;
  items?: NavSubItem[];
};

/** Navegação principal do app. Rotas ainda não criadas respondem 404. */
export const navMain: NavItem[] = [
  { title: 'Visão geral', url: '/', icon: 'dashboard' },
  {
    title: 'Transações',
    url: '/transacoes',
    icon: 'transactions',
    items: [
      { title: 'Todas', url: '/transacoes', icon: 'list' },
      { title: 'Receitas', url: '/transacoes/receitas', icon: 'income' },
      { title: 'Despesas', url: '/transacoes/despesas', icon: 'expense' },
      { title: 'Transferências', url: '/transacoes/transferencias', icon: 'transfer' },
      { title: 'Recorrentes', url: '/transacoes/recorrentes', icon: 'recurring' },
    ],
  },
  { title: 'Cartões', url: '/cartoes', icon: 'credit-card' },
  {
    title: 'Planejamento',
    url: '/planejamento',
    icon: 'goal',
    items: [
      { title: 'Orçamentos', url: '/planejamento/orcamentos', icon: 'wallet' },
      { title: 'Metas', url: '/planejamento/metas', icon: 'flag' },
    ],
  },
  { title: 'Relatórios', url: '/relatorios', icon: 'reports' },
];

export const navSecondary: NavItem[] = [
  { title: 'Importar extrato', url: '/importar', icon: 'upload' },
  { title: 'Categorias', url: '/categorias', icon: 'category' },
  { title: 'Membros', url: '/membros', icon: 'user' },
  { title: 'Configurações', url: '/configuracoes', icon: 'settings' },
];

/** Páginas fora do menu (acessadas pela sidebar de contas, por exemplo) que aparecem no breadcrumb. */
export const pageLinks: NavLink[] = [{ title: 'Contas', url: '/contas' }];

export function isActivePath(pathname: string, url: string) {
  if (url === '/') {
    return pathname === '/';
  }
  return pathname === url || pathname.startsWith(`${url}/`);
}

/** Trilha do breadcrumb a partir da rota atual, usando a navegação acima. */
export function getBreadcrumb(pathname: string): NavLink[] {
  for (const item of [...navMain, ...navSecondary, ...pageLinks] as NavItem[]) {
    if (!isActivePath(pathname, item.url)) {
      continue;
    }
    const subItem = item.items?.find(
      (sub) => sub.url !== item.url && isActivePath(pathname, sub.url),
    );
    return subItem
      ? [{ title: item.title, url: item.url }, { title: subItem.title, url: subItem.url }]
      : [{ title: item.title, url: item.url }];
  }
  return [];
}
