'use client';

import { Text } from '@/components/ui/Text';
import { classMerge } from '@/lib/utils';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as React from 'react';
import { useControlledState } from './PanelContext';
import type { PanelCheckboxItemProps } from './types';

export function PanelCheckboxItem({
  label,
  description,
  checked,
  defaultChecked = false,
  indeterminate = false,
  onCheckedChange,
  disabled = false,
  name,
  value,
  controlAriaLabel,
  className,
  ...props
}: PanelCheckboxItemProps) {
  const [isChecked, setChecked] = useControlledState(
    checked,
    defaultChecked,
    onCheckedChange,
  );
  const id = React.useId();
  const controlId = `${id}-control`;
  const descriptionId = `${id}-description`;

  return (
    <div className={classMerge('flex items-start gap-2', className)} {...props}>
      <span className="flex h-5 shrink-0 items-center">
        <CheckboxPrimitive.Root
          id={controlId}
          checked={indeterminate && !isChecked ? 'indeterminate' : isChecked}
          onCheckedChange={(next) => setChecked(next === true)}
          disabled={disabled}
          name={name}
          value={value}
          aria-label={controlAriaLabel}
          aria-describedby={description ? descriptionId : undefined}
          className={classMerge(
            'group flex size-3.5 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-background-neutral-000 ring-1 ring-border-neutral-rest',
            'transition-colors duration-150 ease-out',
            'data-[state=checked]:bg-background-brand-primary-rest data-[state=checked]:ring-background-brand-primary-hover',
            'data-[state=indeterminate]:bg-background-brand-primary-rest data-[state=indeterminate]:ring-background-brand-primary-hover',
            'disabled:cursor-not-allowed disabled:bg-background-neutral-disabled disabled:ring-border-neutral-disabled data-[state=checked]:disabled:bg-background-neutral-disabled data-[state=checked]:disabled:ring-border-neutral-disabled',
            'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-white/30 focus-visible:ring-offset-2',
          )}
        >
          <CheckboxPrimitive.Indicator
            forceMount
            className="flex size-full items-center justify-center text-white"
          >
            <svg
              viewBox="0 0 10.1668 10.1668"
              fill="none"
              aria-hidden="true"
              className="size-2.5 group-data-[state=indeterminate]:hidden"
            >
              <path
                d="M1 5.52L3.92 9.17L9.17 1"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={classMerge(
                  '[stroke-dasharray:15] [stroke-dashoffset:15]',
                  'transition-[stroke-dashoffset] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  'group-data-[state=checked]:duration-[350ms] group-data-[state=checked]:[stroke-dashoffset:0]',
                  'motion-reduce:transition-none',
                )}
              />
            </svg>
            <span className="hidden h-0.5 w-2 rounded-full bg-current group-data-[state=indeterminate]:block" />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
      </span>
      {(label || description) && (
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {label && (
            <label
              htmlFor={controlId}
              className={classMerge(
                'w-fit cursor-pointer',
                disabled && 'cursor-not-allowed',
              )}
            >
              <Text size="sm" weight="medium" className="block">
                {label}
              </Text>
            </label>
          )}
          {description && (
            <Text id={descriptionId} size="xs" color="secondary">
              {description}
            </Text>
          )}
        </div>
      )}
    </div>
  );
}
PanelCheckboxItem.displayName = 'Panel.CheckboxItem';
