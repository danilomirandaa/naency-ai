'use client';

import { MemberAvatar } from '@/components/finance/MemberAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Icon } from '@/components/ui/Icon';
import { Sidebar, useSidebar } from '@/components/ui/Sidebar';
import { useTransition } from 'react';

export type NavUserData = {
  name: string;
  description: string;
  avatarUrl?: string;
};

function UserSummary({ user }: { user: NavUserData }) {
  return (
    <>
      <MemberAvatar name={user.name} avatarUrl={user.avatarUrl} shape="square" />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-typography-neutral-secondary text-xs">
          {user.description}
        </span>
      </div>
    </>
  );
}

export function NavUser({
  user,
  signOutAction,
}: {
  user: NavUserData;
  signOutAction: () => Promise<void>;
}) {
  const { isMobile } = useSidebar();
  const [isSigningOut, startSignOut] = useTransition();

  return (
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Sidebar.MenuButton
              size="lg"
              className="data-[state=open]:bg-background-neutral-200"
            >
              <UserSummary user={user} />
              <Icon icon="selector" className="ml-auto" />
            </Sidebar.MenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <UserSummary user={user} />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Icon icon="user" className="text-icon-neutral-rest" />
                Minha conta
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon icon="bell" className="text-icon-neutral-rest" />
                Notificações
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isSigningOut}
              onSelect={() => startSignOut(() => signOutAction())}
            >
              <Icon icon="logout" className="text-icon-neutral-rest" />
              {isSigningOut ? 'Saindo…' : 'Sair'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  );
}
