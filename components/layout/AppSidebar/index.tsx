import { BrandMark } from '@/components/layout/BrandMark';
import { navMain, navSecondary } from '@/components/layout/navigation';
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

export type AppSidebarProps = React.ComponentProps<typeof Sidebar.Root> & {
  user: NavUserData;
  signOutAction: () => Promise<void>;
};

export function AppSidebar({ user, signOutAction, ...props }: AppSidebarProps) {
  return (
    <Sidebar.Root variant="inset" {...props}>
      <Sidebar.Header>
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton size="lg" asChild>
              <Link href="/">
                <BrandMark />
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
        <NavUser user={user} signOutAction={signOutAction} />
      </Sidebar.Footer>
    </Sidebar.Root>
  );
}
