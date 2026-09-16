import { Separator, type SeparatorProps } from '@/components/ui/Separator';
import { classMerge } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import type * as React from 'react';

type DivProps = React.ComponentProps<'div'>;

export function SidebarHeader({ className, ...props }: DivProps) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={classMerge('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  );
}
SidebarHeader.displayName = 'Sidebar.Header';

export function SidebarFooter({ className, ...props }: DivProps) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={classMerge('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  );
}
SidebarFooter.displayName = 'Sidebar.Footer';

export function SidebarContent({ className, ...props }: DivProps) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={classMerge(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      {...props}
    />
  );
}
SidebarContent.displayName = 'Sidebar.Content';

export function SidebarSeparator({ className, ...props }: SeparatorProps) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={classMerge('mx-2 w-auto', className)}
      {...props}
    />
  );
}
SidebarSeparator.displayName = 'Sidebar.Separator';

export function SidebarInput({
  className,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={classMerge(
        'h-8 w-full rounded-control-sm border border-border-neutral-rest bg-background-neutral-000 px-2.5 text-sm text-typography-neutral-primary outline-hidden placeholder:text-typography-neutral-tertiary focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  );
}
SidebarInput.displayName = 'Sidebar.Input';

export function SidebarGroup({ className, ...props }: DivProps) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={classMerge('relative flex w-full min-w-0 flex-col p-2', className)}
      {...props}
    />
  );
}
SidebarGroup.displayName = 'Sidebar.Group';

export function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: DivProps & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={classMerge(
        'flex h-8 shrink-0 items-center rounded-control-sm px-2 font-medium text-typography-neutral-secondary text-xs outline-hidden ring-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
        className,
      )}
      {...props}
    />
  );
}
SidebarGroupLabel.displayName = 'Sidebar.GroupLabel';

export function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={classMerge(
        'absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-control-xs p-0 text-typography-neutral-primary outline-hidden ring-ring transition-transform hover:bg-background-neutral-200 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        // Aumenta a área de toque no mobile.
        'after:-inset-2 after:absolute md:after:hidden',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}
SidebarGroupAction.displayName = 'Sidebar.GroupAction';

export function SidebarGroupContent({ className, ...props }: DivProps) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={classMerge('w-full text-sm', className)}
      {...props}
    />
  );
}
SidebarGroupContent.displayName = 'Sidebar.GroupContent';
