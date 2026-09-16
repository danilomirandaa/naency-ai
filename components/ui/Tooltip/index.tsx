import { classMerge } from '@/lib/utils';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';
import { useDebounceCallback } from 'usehooks-ts';

export const TooltipProvider = TooltipPrimitive.Provider;

export type TooltipProps = React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Root
> & {
  content: React.ReactNode;
  side?: TooltipPrimitive.TooltipContentProps['side'];
  contentClassName?: string;
  disabled?: boolean;
  disablePortal?: boolean;
  openDelay?: number;
};

export const Tooltip = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipProps
>(
  (
    {
      children,
      content,
      side = 'top',
      contentClassName,
      disabled = false,
      disablePortal = false,
      openDelay = 0,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const openTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    const cancelPendingOpen = () => {
      if (openTimeout.current) {
        clearTimeout(openTimeout.current);
        openTimeout.current = null;
      }
    };

    React.useEffect(() => cancelPendingOpen, []);

    const debouncedClose = useDebounceCallback(() => {
      setOpen(false);
    }, 100);

    const handleMouseEnter = () => {
      debouncedClose.cancel();
      if (openDelay > 0) {
        cancelPendingOpen();
        openTimeout.current = setTimeout(() => setOpen(true), openDelay);
      } else {
        setOpen(true);
      }
    };

    const handleMouseLeave = () => {
      cancelPendingOpen();
      debouncedClose();
    };

    const tooltipContent = (
      <TooltipPrimitive.Content
        ref={ref}
        side={side}
        avoidCollisions
        sideOffset={2}
        className={classMerge(
          'fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 pointer-events-none z-50 max-w-lg animate-in overflow-hidden rounded-control-sm bg-black px-3 py-1.5 text-white text-xs data-[state=closed]:animate-out',
          contentClassName,
        )}
      >
        {content}
        <TooltipPrimitive.Arrow className="pointer-events-none fill-black" />
      </TooltipPrimitive.Content>
    );

    if (disabled) {
      return React.isValidElement(children)
        ? React.cloneElement(children, props)
        : children;
    }

    return (
      <TooltipProvider>
        <TooltipPrimitive.Root open={open} delayDuration={200} {...props}>
          <TooltipPrimitive.Trigger
            asChild
            onClick={() => {
              cancelPendingOpen();
              setOpen((prev) => !prev);
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={disabled ? 'pointer-events-none' : 'pointer-events-auto'}
          >
            {children}
          </TooltipPrimitive.Trigger>

          {disablePortal ? (
            tooltipContent
          ) : (
            <TooltipPrimitive.Portal>
              <div className="pointer-events-none">{tooltipContent}</div>
            </TooltipPrimitive.Portal>
          )}
        </TooltipPrimitive.Root>
      </TooltipProvider>
    );
  },
);

Tooltip.displayName = 'Tooltip';
