'use client';

import { Icon } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';
import { Command as CommandPrimitive } from 'cmdk';
import type * as React from 'react';

/** Portado do shadcn/ui (radix-vega) com os tokens do Naency. Busca + lista navegável por teclado. */
function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={classMerge(
        'flex size-full flex-col overflow-hidden rounded-control-lg bg-background-neutral-000 text-typography-neutral-primary',
        className,
      )}
      {...props}
    />
  );
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="flex items-center gap-2 border-border-neutral-subtle border-b px-3">
      <Icon icon="search" className="size-4 shrink-0 text-icon-neutral-rest" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={classMerge(
          'h-10 w-full bg-transparent text-sm outline-hidden placeholder:text-typography-neutral-secondary disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={classMerge('max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-hidden', className)}
      {...props}
    />
  );
}

function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={classMerge('py-6 text-center text-sm text-typography-neutral-secondary', className)}
      {...props}
    />
  );
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={classMerge(
        'overflow-hidden p-1 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-typography-neutral-secondary',
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={classMerge('-mx-1 h-px bg-border-neutral-subtle', className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  children,
  checked = false,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item> & { checked?: boolean }) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      data-checked={checked}
      className={classMerge(
        'group/command-item relative flex cursor-default select-none items-center gap-2 rounded-control px-2 py-1.5 text-sm outline-hidden',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-background-neutral-100',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
        className,
      )}
      {...props}
    >
      {children}
      <Icon
        icon="check"
        className="ml-auto size-4 text-icon-neutral-rest opacity-0 group-data-[checked=true]/command-item:opacity-100"
      />
    </CommandPrimitive.Item>
  );
}

export { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator };
