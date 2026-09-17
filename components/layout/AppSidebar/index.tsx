import { navMain, navSecondary } from '@/components/layout/navigation';
import { Sidebar } from '@/components/ui/Sidebar';
import type * as React from 'react';
import { type NavAccount, NavAccounts } from './NavAccounts';
import { NavMain } from './NavMain';
import { NavSecondary } from './NavSecondary';
import { type NavUserData, NavUser } from './NavUser';
import { type WorkspaceSwitcherProps, WorkspaceSwitcher } from './WorkspaceSwitcher';

export type AppSidebarProps = React.ComponentProps<typeof Sidebar.Root> &
  Omit<WorkspaceSwitcherProps, 'newWorkspaceHref'> & {
    user: NavUserData;
    signOutAction: () => Promise<void>;
    accounts: NavAccount[];
    canCreateAccount: boolean;
  };

export function AppSidebar({
  user,
  signOutAction,
  workspaces,
  activeWorkspaceId,
  selectWorkspaceAction,
  accounts,
  canCreateAccount,
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
        <NavAccounts accounts={accounts} canCreate={canCreateAccount} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </Sidebar.Content>
      <Sidebar.Footer>
        <NavUser user={user} signOutAction={signOutAction} />
      </Sidebar.Footer>
    </Sidebar.Root>
  );
}
