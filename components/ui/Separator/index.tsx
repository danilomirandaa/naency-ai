'use client';

import { classMerge } from '@/lib/utils';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import type * as React from 'react';

export type SeparatorProps = React.ComponentProps<typeof SeparatorPrimitive.Root>;

export function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={classMerge(
        'shrink-0 bg-border-neutral-subtle data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    />
  );
}
