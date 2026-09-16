'use client';

import { Button, type ButtonProps } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet';
import { classMerge } from '@/lib/utils';
import type * as React from 'react';
import { SIDEBAR_WIDTH_MOBILE } from './constants';
import { useSidebar } from './SidebarContext';

export type SidebarRootProps = React.ComponentProps<'div'> & {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
};

export function SidebarRoot({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  ...props
}: SidebarRootProps) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        className={classMerge(
          'flex h-full w-(--sidebar-width) flex-col bg-background-surface-sunken text-typography-neutral-primary',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          hideClose
          className="w-(--sidebar-width) p-0"
          style={
            { '--sidebar-width': SIDEBAR_WIDTH_MOBILE } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Navegação principal</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer hidden text-typography-neutral-primary md:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* Reserva o espaço da sidebar fixa no fluxo do layout. */}
      <div
        data-slot="sidebar-gap"
        className={classMerge(
          'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
        )}
      />
      <div
        data-slot="sidebar-container"
        className={classMerge(
          'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex h-full w-full flex-col bg-background-surface-sunken group-data-[variant=floating]:rounded-control-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-border-neutral-subtle group-data-[variant=floating]:shadow-xs"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
SidebarRoot.displayName = 'Sidebar.Root';

export function SidebarTrigger({ className, onClick, ...props }: ButtonProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="standalone"
      size="icon"
      title="Alternar menu (⌘B)"
      icon={<Icon icon="sidebar" />}
      className={classMerge('size-7', className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    />
  );
}
SidebarTrigger.displayName = 'Sidebar.Trigger';

export function SidebarRail({
  className,
  ...props
}: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Alternar menu"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Alternar menu"
      className={classMerge(
        '-translate-x-1/2 absolute inset-y-0 z-20 hidden w-4 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-border-neutral-subtle group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex',
        'in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize',
        '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        'hover:group-data-[collapsible=offcanvas]:bg-background-surface-sunken group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full',
        '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
        '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
        className,
      )}
      {...props}
    />
  );
}
SidebarRail.displayName = 'Sidebar.Rail';

export function SidebarInset({
  className,
  ...props
}: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={classMerge(
        'relative flex w-full flex-1 flex-col bg-background',
        'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-2xl md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:border-border-neutral-subtle md:peer-data-[variant=inset]:shadow-xs md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
        className,
      )}
      {...props}
    />
  );
}
SidebarInset.displayName = 'Sidebar.Inset';
