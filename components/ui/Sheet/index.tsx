'use client';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import type * as React from 'react';

type SheetSide = 'top' | 'right' | 'bottom' | 'left';

export type SheetContentProps = React.ComponentProps<
  typeof SheetPrimitive.Content
> & {
  side?: SheetSide;
  hideClose?: boolean;
};

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

const sideClassNames: Record<SheetSide, string> = {
  right:
    'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
  left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
  top: 'inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
  bottom:
    'inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
};

export function SheetContent({
  className,
  children,
  side = 'right',
  hideClose = false,
  ...props
}: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        data-slot="sheet-overlay"
        className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in"
      />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={classMerge(
          'fixed z-50 flex flex-col gap-4 border-border-neutral-subtle bg-background-surface-sunken text-typography-neutral-primary shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:animate-in data-[state=open]:duration-500',
          sideClassNames[side],
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <SheetPrimitive.Close asChild>
            <Button
              title="Fechar"
              variant="standalone"
              size="icon"
              icon={<Icon icon="close" />}
              className="absolute top-4 right-4"
            />
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={classMerge('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  );
}

export function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={classMerge('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={classMerge(
        'font-semibold text-typography-neutral-primary',
        className,
      )}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={classMerge(
        'text-sm text-typography-neutral-secondary',
        className,
      )}
      {...props}
    />
  );
}
