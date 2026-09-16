'use client';

import { Icon } from '@/components/ui/Icon';
import { SimpleLink } from '@/components/ui/SimpleLink';
import { Text } from '@/components/ui/Text';
import { classMerge } from '@/lib/utils';
import * as React from 'react';
import type { PanelFieldListProps, PanelFieldProps } from './types';

const fieldListVariants = {
  plain: '',
  divided:
    '[&>div:not(:last-child)]:border-b [&>div]:border-border-neutral-subtle',
  bordered:
    '[&>div:first-child]:rounded-t [&>div:first-child]:border-t [&>div:last-child]:rounded-b [&>div:last-child]:border-b [&>div:not(:last-child)]:border-b [&>div]:border-border-neutral-subtle [&>div]:border-x',
};

const fieldListSizes = {
  sm: {
    plain: '[&>div]:py-1.5',
    divided: '[&>div]:p-2',
    bordered: '[&>div]:p-2',
  },
  xs: {
    plain: '[&>div]:py-1',
    divided: '[&>div]:py-1.5',
    bordered: '[&>div]:p-1.5',
  },
};

export function PanelFieldList({
  label,
  action,
  variant = 'plain',
  size = 'sm',
  className,
  children,
  ...props
}: PanelFieldListProps) {
  return (
    <div
      className={classMerge('flex min-w-0 flex-col gap-2', className)}
      {...props}
    >
      {(label || action) && (
        <div className="flex items-center justify-between gap-2">
          <Text size="xs" weight="medium" color="secondary">
            {label}
          </Text>
          {action}
        </div>
      )}
      <div
        className={classMerge(
          fieldListVariants[variant],
          fieldListSizes[size][variant],
        )}
      >
        {children}
      </div>
    </div>
  );
}
PanelFieldList.displayName = 'Panel.FieldList';

export function PanelField({
  label,
  value,
  mono = false,
  copyValue,
  href,
  className,
  children,
  ...props
}: PanelFieldProps) {
  return (
    <div
      className={classMerge(
        'flex items-center justify-between gap-2',
        className,
      )}
      {...props}
    >
      <Text size="xs" color="secondary" className="text-nowrap">
        {label}
      </Text>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right text-typography-neutral-primary text-xs">
        {children ??
          (href ? (
            <SimpleLink
              href={href}
              size="xs"
              className="min-w-0 font-normal tracking-normal"
              textClassNames={classMerge(
                'min-w-0 justify-end whitespace-nowrap break-normal',
                mono && 'font-mono',
              )}
            >
              {typeof value === 'string'
                ? value
                : value == null
                  ? '-'
                  : undefined}
            </SimpleLink>
          ) : (
            <span
              className={classMerge(
                'block min-w-0 truncate text-right text-typography-neutral-primary text-xs',
                mono && 'font-mono',
              )}
            >
              {value ?? '-'}
            </span>
          ))}
        {copyValue && <PanelFieldCopy value={copyValue} />}
      </div>
    </div>
  );
}
PanelField.displayName = 'Panel.Field';

function PanelFieldCopy({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        setCopied(false);
      });
  };

  return (
    <button
      type="button"
      aria-label="Copy to clipboard"
      onClick={copy}
      className="shrink-0 rounded-sm text-typography-neutral-secondary transition-colors hover:text-typography-neutral-primary"
    >
      <Icon icon={copied ? 'check' : 'copy'} className="size-3.5" />
    </button>
  );
}
PanelFieldCopy.displayName = 'Panel.FieldCopy';
