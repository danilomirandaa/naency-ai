'use client';

import { BrandMark } from '@/components/layout/BrandMark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Icon } from '@/components/ui/Icon';
import { Sidebar, useSidebar } from '@/components/ui/Sidebar';
import { ROLE_LABELS } from '@/lib/permissions';
import type { WorkspaceSummary } from '@/lib/workspaces/active';
import Link from 'next/link';
import { useTransition } from 'react';

export type WorkspaceSwitcherProps = {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string;
  selectWorkspaceAction: (workspaceId: string) => Promise<void>;
  newWorkspaceHref: string;
};

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  selectWorkspaceAction,
  newWorkspaceHref,
}: WorkspaceSwitcherProps) {
  const { isMobile } = useSidebar();
  const [isSwitching, startSwitch] = useTransition();
  const active = workspaces.find((workspace) => workspace.id === activeWorkspaceId);

  if (!active) {
    return null;
  }

  return (
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Sidebar.MenuButton
              size="lg"
              aria-label={`Espaço atual: ${active.name}. Trocar espaço`}
              aria-busy={isSwitching || undefined}
              className="data-[state=open]:bg-background-neutral-200"
            >
              <BrandMark variant="icon" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{active.name}</span>
                <span className="truncate text-typography-neutral-secondary text-xs">
                  {ROLE_LABELS[active.role]}
                </span>
              </div>
              <Icon icon="selector" className="ml-auto" />
            </Sidebar.MenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-medium text-typography-neutral-secondary text-xs">
              Espaços
            </DropdownMenuLabel>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                disabled={isSwitching}
                onSelect={() => {
                  if (workspace.id !== activeWorkspaceId) {
                    startSwitch(() => selectWorkspaceAction(workspace.id));
                  }
                }}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{workspace.name}</span>
                  <span className="truncate text-typography-neutral-secondary text-xs">
                    {ROLE_LABELS[workspace.role]}
                  </span>
                </span>
                {workspace.id === activeWorkspaceId && (
                  <Icon icon="check" className="text-icon-brand-primary-rest" aria-label="Atual" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={newWorkspaceHref}>
                <Icon icon="add" className="text-icon-neutral-rest" />
                Novo espaço
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  );
}
