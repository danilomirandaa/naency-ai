import { navMain, navSecondary } from '@/components/layout/navigation';
import { Icon } from '@/components/ui/Icon';
import { Sidebar } from '@/components/ui/Sidebar';
import Link from 'next/link';
import type * as React from 'react';
import { type NavAccount, NavAccounts } from './NavAccounts';
import { NavMain } from './NavMain';
import { NavSecondary } from './NavSecondary';
import { type NavUserData, NavUser } from './NavUser';

// Dados fixos até existir a camada de dados (contas e usuário reais).
const accounts: NavAccount[] = [
  { name: 'Conta corrente', url: '/contas/conta-corrente', icon: 'bank' },
  { name: 'Poupança', url: '/contas/poupanca', icon: 'wallet' },
  { name: 'Carteira', url: '/contas/carteira', icon: 'wallet' },
];

const user: NavUserData = {
  name: 'Danilo Miranda',
  description: 'Conta pessoal',
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar.Root>) {
  return (
    <Sidebar.Root variant="inset" {...props}>
      <Sidebar.Header>
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-control-sm bg-background-brand-primary-rest text-typography-brand-on-primary">
                  <Icon icon="wallet" className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Naency</span>
                  <span className="truncate text-typography-neutral-secondary text-xs">
                    Controle financeiro
                  </span>
                </div>
              </Link>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.Header>
      <Sidebar.Content>
        <NavMain items={navMain} />
        <NavAccounts accounts={accounts} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </Sidebar.Content>
      <Sidebar.Footer>
        <NavUser user={user} />
      </Sidebar.Footer>
    </Sidebar.Root>
  );
}
