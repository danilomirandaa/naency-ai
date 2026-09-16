'use client';

import { classMerge } from '@/lib/utils';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as React from 'react';

export type SwitchProps = React.ComponentPropsWithRef<
  typeof SwitchPrimitive.Root
> & {
  size?: 'normal' | 'small' | 'tiny';
  isLoading?: boolean;
  errorKey?: number;
};

export function Switch({
  className,
  size = 'small',
  isLoading = false,
  errorKey,
  disabled,
  ...props
}: SwitchProps) {
  const [isShaking, setIsShaking] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const lastErrorKey = React.useRef(errorKey);

  React.useEffect(() => {
    if (errorKey === undefined || errorKey === lastErrorKey.current) {
      return;
    }
    lastErrorKey.current = errorKey;
    setIsShaking(true);
    setHasError(true);
    const timeout = window.setTimeout(() => setHasError(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [errorKey]);

  return (
    <SwitchPrimitive.Root
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      data-loading={isLoading || undefined}
      onAnimationEnd={() => setIsShaking(false)}
      onPointerDown={() => setHasError(false)}
      className={classMerge(
        'group flex shrink-0 cursor-pointer items-center rounded-full bg-background-neutral-300 p-0.5',
        'ring-1 ring-[rgba(25,28,33,0.2)] dark:ring-white/20',
        'transition-colors duration-150 ease-out',
        'active:bg-border-neutral-hover',
        'data-[state=checked]:bg-background-brand-primary-rest data-[state=checked]:ring-background-brand-primary-hover dark:data-[state=checked]:ring-background-brand-primary-hover',
        'data-[state=checked]:active:bg-background-brand-primary-hover',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[loading]:cursor-wait data-[loading]:opacity-100',
        'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-white/30 focus-visible:ring-offset-2',
        size === 'normal'
          ? 'h-5 w-8'
          : size === 'small'
            ? 'h-4 w-6'
            : 'h-3.5 w-5',
        isShaking && 'switch-shake',
        hasError &&
          'bg-background-status-critical-rest ring-border-status-critical-hover data-[state=checked]:bg-background-status-critical-rest data-[state=checked]:ring-border-status-critical-hover dark:ring-border-status-critical-hover dark:data-[state=checked]:ring-border-status-critical-hover',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={classMerge(
          'relative block rounded-full bg-linear-to-b bg-white from-black/0 to-black/[0.02] ring-1 ring-[rgba(25,28,33,0.08)] transition-[width,transform] duration-[120ms] ease-out',
          'shadow-[0_2px_2px_-1px_rgba(0,0,0,0.1),0_4px_4px_-2px_rgba(0,0,0,0.06)] group-data-[state=checked]:shadow-none',
          size === 'normal'
            ? 'h-4 w-4 group-active:w-[18px] data-[state=checked]:translate-x-3 group-active:data-[state=checked]:translate-x-[10px]'
            : size === 'small'
              ? 'h-3 w-3 group-active:w-[14px] data-[state=checked]:translate-x-2 group-active:data-[state=checked]:translate-x-[6px]'
              : 'h-2.5 w-2.5 group-active:w-3 data-[state=checked]:translate-x-1.5 group-active:data-[state=checked]:translate-x-1',
        )}
      >
        {isLoading && (
          <span
            aria-hidden
            className="absolute inset-[2px] animate-spin rounded-full border-[1.5px] border-current border-t-transparent text-background-brand-primary-rest"
          />
        )}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}
