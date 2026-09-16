'use client';

import { Icon, type Icons } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';
import { motion } from 'motion/react';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';

export type ChipButtonProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'children'
> & {
  icon?: Icons;
  selected?: boolean;
  children?: React.ReactNode;
};

export const ChipButton = forwardRef<HTMLButtonElement, ChipButtonProps>(
  function ChipButton(
    { icon, selected = false, className, children, type = 'button', ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={selected}
        className={classMerge(
          'flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control-sm px-2 text-xs transition-colors hover:bg-background-neutral-100 hover:text-typography-neutral-primary disabled:pointer-events-none disabled:opacity-50',
          selected
            ? 'bg-background-neutral-100 font-medium text-typography-neutral-primary'
            : 'text-typography-neutral-secondary',
          className,
        )}
        {...props}
      >
        {icon ? <Icon icon={icon} className="size-4 shrink-0" /> : null}
        {children}
      </button>
    );
  },
);

export const MotionChipButton = motion.create(ChipButton);
