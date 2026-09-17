import { navMain, navSecondary } from '@/components/layout/navigation';
import { Sidebar } from '@/components/ui/Sidebar';
import type * as React from 'react';
import { type NavAccount, NavAccounts } from './NavAccounts';
import { NavMain } from './NavMain';
import { NavSecondary } from './NavSecondary';
import { type NavUserData, NavUser } from './NavUser';
import { type WorkspaceSwitcherProps, WorkspaceSwitcher } from './WorkspaceSwitcher';

// Dados fixos até existir a camada de dados (contas e usuário reais).
const accounts: NavAccount[] = [
  { name: 'Conta corrente', url: '/contas/conta-corrente', icon: 'bank' },
  { name: 'Poupança', url: '/contas/poupanca', icon: 'wallet' },
  { name: 'Carteira', url: '/contas/carteira', icon: 'wallet' },
];

export type AppSidebarProps = React.ComponentProps<typeof Sidebar.Root> &
  Omit<WorkspaceSwitcherProps, 'newWorkspaceHref'> & {
    user: NavUserData;
    signOutAction: () => Promise<void>;
  };

export function AppSidebar({
  user,
  signOutAction,
  workspaces,
  activeWorkspaceId,
  selectWorkspaceAction,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar.Root variant="inset" {...props}>
      <Sidebar.Header>
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          selectWorkspaceAction={selectWorkspaceAction}
          newWorkspaceHref="/comecar?novo=1"
        />
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
