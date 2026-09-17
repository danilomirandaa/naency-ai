'use client';

import { Icon } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import type * as React from 'react';

/** Portado do shadcn/ui (radix-vega) com os tokens do Naency. */
export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={classMerge(
        'peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-border-neutral-hover bg-background-neutral-000 shadow-xs outline-hidden transition-shadow',
        // Área de toque maior que o quadrado.
        'after:absolute after:-inset-x-3 after:-inset-y-2',
        'focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-border-status-critical-rest',
        'data-[state=checked]:border-button-brand-primary-rest data-[state=checked]:bg-button-brand-primary-rest data-[state=checked]:text-typography-brand-on-primary',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="grid place-content-center text-current">
        <Icon icon="check" className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
