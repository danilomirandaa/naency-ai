'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Icon, type Icons } from '@/components/ui/Icon';
import { Sidebar, useSidebar } from '@/components/ui/Sidebar';
import Link from 'next/link';

export type NavAccount = {
  name: string;
  url: string;
  icon: Icons;
};

export function NavAccounts({ accounts }: { accounts: NavAccount[] }) {
  const { isMobile } = useSidebar();

  return (
    <Sidebar.Group className="group-data-[collapsible=icon]:hidden">
      <Sidebar.GroupLabel>Contas</Sidebar.GroupLabel>
      <Sidebar.Menu>
        {accounts.map((account) => (
          <Sidebar.MenuItem key={account.url}>
            <Sidebar.MenuButton asChild>
              <Link href={account.url}>
                <Icon icon={account.icon} />
                <span>{account.name}</span>
              </Link>
            </Sidebar.MenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Sidebar.MenuAction showOnHover>
                  <Icon icon="dots" />
                  <span className="sr-only">Ações de {account.name}</span>
                </Sidebar.MenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? 'bottom' : 'right'}
                align={isMobile ? 'end' : 'start'}
              >
                <DropdownMenuItem>
                  <Icon icon="view" className="text-icon-neutral-rest" />
                  <span>Ver extrato</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Icon icon="edit" className="text-icon-neutral-rest" />
                  <span>Editar conta</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-typography-status-critical-rest">
                  <Icon icon="delete" />
                  <span>Excluir conta</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Sidebar.MenuItem>
        ))}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton className="text-typography-neutral-secondary">
            <Icon icon="add" />
            <span>Nova conta</span>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Group>
  );
}
