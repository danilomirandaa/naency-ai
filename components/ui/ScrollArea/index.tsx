import * as React from 'react';

import { classMerge } from '@/lib/utils';

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

export const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    viewportRef?: React.Ref<HTMLDivElement>;
    viewportClassName?: string;
    orientation?: 'vertical' | 'horizontal' | 'both';
    verticalScrollBarClassName?: string;
    horizontalScrollBarClassName?: string;
  }
>(
  (
    {
      className,
      children,
      viewportRef,
      viewportClassName,
      orientation = 'vertical',
      verticalScrollBarClassName,
      horizontalScrollBarClassName,
      ...props
    },
    ref,
  ) => (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={classMerge('relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        className={classMerge(
          'h-full w-full scroll-smooth rounded-[inherit]',
          viewportClassName,
        )}
        ref={viewportRef}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation !== 'horizontal' && (
        <ScrollBar
          orientation="vertical"
          className={verticalScrollBarClassName}
        />
      )}
      {orientation !== 'vertical' && (
        <ScrollBar
          orientation="horizontal"
          className={horizontalScrollBarClassName}
        />
      )}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  ),
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

export const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={classMerge(
      'relative flex touch-none select-none transition-colors',
      orientation === 'vertical' &&
        'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' &&
        'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-background-neutral-200 dark:bg-background-neutral-200" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;
