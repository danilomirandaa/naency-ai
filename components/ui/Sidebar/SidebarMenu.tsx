'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import { classMerge } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import type * as React from 'react';
import { useSidebar } from './SidebarContext';

export function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={classMerge('flex w-full min-w-0 flex-col gap-1', className)}
      {...props}
    />
  );
}
SidebarMenu.displayName = 'Sidebar.Menu';

export function SidebarMenuItem({
  className,
  ...props
}: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={classMerge('group/menu-item relative', className)}
      {...props}
    />
  );
}
SidebarMenuItem.displayName = 'Sidebar.MenuItem';

export const sidebarMenuButtonVariants = cva(
  'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-control-sm p-2 text-left text-sm text-typography-neutral-primary outline-hidden ring-ring transition-[width,height,padding] hover:bg-background-neutral-200 focus-visible:ring-2 active:bg-background-neutral-200 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! data-[active=true]:bg-background-neutral-200 data-[active=true]:font-medium data-[state=open]:hover:bg-background-neutral-200 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-icon-neutral-rest data-[active=true]:[&>svg]:text-icon-neutral-pressed',
  {
    variants: {
      variant: {
        default: '',
        outline:
          'bg-background-neutral-000 shadow-[0_0_0_1px_var(--border-neutral-subtle)] hover:shadow-[0_0_0_1px_var(--background-neutral-200)]',
      },
      size: {
        default: 'h-8 text-sm',
        sm: 'h-7 text-xs',
        lg: 'h-12 text-sm group-data-[collapsible=icon]:p-0!',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type SidebarMenuButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof sidebarMenuButtonVariants> & {
    asChild?: boolean;
    isActive?: boolean;
    /** Mostrado ao lado do botão quando a sidebar está recolhida em ícones. */
    tooltip?: React.ReactNode;
  };

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot : 'button';
  const { isMobile, state } = useSidebar();

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={classMerge(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  return (
    <Tooltip
      content={tooltip}
      side="right"
      disabled={state !== 'collapsed' || isMobile}
    >
      {button}
    </Tooltip>
  );
}
SidebarMenuButton.displayName = 'Sidebar.MenuButton';

export function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={classMerge(
        'absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-control-xs p-0 text-icon-neutral-rest outline-hidden ring-ring transition-transform hover:bg-background-neutral-300 hover:text-icon-neutral-hover focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        // Aumenta a área de toque no mobile.
        'after:-inset-2 after:absolute md:after:hidden',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-1.5',
        'peer-data-[size=lg]/menu-button:top-2.5',
        'group-data-[collapsible=icon]:hidden',
        showOnHover &&
          'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0',
        className,
      )}
      {...props}
    />
  );
}
SidebarMenuAction.displayName = 'Sidebar.MenuAction';

export function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={classMerge(
        'pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-control-xs px-1 font-medium text-typography-neutral-secondary text-xs tabular-nums',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-1.5',
        'peer-data-[size=lg]/menu-button:top-2.5',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}
SidebarMenuBadge.displayName = 'Sidebar.MenuBadge';

export function SidebarMenuSkeleton({
  className,
  showIcon = false,
  width = '70%',
  ...props
}: React.ComponentProps<'div'> & {
  showIcon?: boolean;
  /** Largura do texto simulado (varie entre itens para parecer natural). */
  width?: string;
}) {
  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={classMerge(
        'flex h-8 items-center gap-2 rounded-control-sm px-2',
        className,
      )}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-control-xs" />}
      <Skeleton className="h-4 flex-1" style={{ maxWidth: width }} />
    </div>
  );
}
SidebarMenuSkeleton.displayName = 'Sidebar.MenuSkeleton';

export function SidebarMenuSub({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={classMerge(
        'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-border-neutral-subtle border-l px-2.5 py-0.5',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}
SidebarMenuSub.displayName = 'Sidebar.MenuSub';

export function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={classMerge('group/menu-sub-item relative', className)}
      {...props}
    />
  );
}
SidebarMenuSubItem.displayName = 'Sidebar.MenuSubItem';

export function SidebarMenuSubButton({
  asChild = false,
  size = 'md',
  isActive = false,
  className,
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean;
  size?: 'sm' | 'md';
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot : 'a';

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={classMerge(
        '-translate-x-px flex h-7 min-w-0 items-center gap-2 overflow-hidden rounded-control-sm px-2 text-typography-neutral-secondary outline-hidden ring-ring hover:bg-background-neutral-200 hover:text-typography-neutral-primary focus-visible:ring-2 active:bg-background-neutral-200 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
        'data-[active=true]:bg-background-neutral-200 data-[active=true]:text-typography-neutral-primary',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}
SidebarMenuSubButton.displayName = 'Sidebar.MenuSubButton';
