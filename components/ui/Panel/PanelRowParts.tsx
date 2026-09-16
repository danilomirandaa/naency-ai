'use client';

import { Icon } from '@/components/ui/Icon';
import { Switch } from '@/components/ui/Switch';
import { Text } from '@/components/ui/Text';
import { classMerge } from '@/lib/utils';
import * as React from 'react';
import { usePanelRow } from './PanelContext';
import type {
  PanelRowActionProps,
  PanelRowBadgeProps,
  PanelRowDescriptionProps,
  PanelRowIconProps,
  PanelRowSwitchProps,
  PanelRowTextProps,
  PanelRowTitleProps,
} from './types';

export function PanelRowSwitch({ className, ...props }: PanelRowSwitchProps) {
  const {
    checked,
    setChecked,
    disabled,
    isMaster,
    controlId,
    titleId,
    descriptionId,
    controlsId,
    hasDescription,
    setHasControl,
  } = usePanelRow();

  React.useLayoutEffect(() => {
    setHasControl(true);
    return () => setHasControl(false);
  }, [setHasControl]);

  return (
    <Switch
      id={controlId}
      checked={checked}
      onCheckedChange={setChecked}
      disabled={disabled}
      aria-labelledby={titleId}
      aria-describedby={hasDescription ? descriptionId : undefined}
      aria-controls={controlsId}
      className={classMerge(isMaster ? 'mt-1' : 'mt-0.5', className)}
      {...props}
    />
  );
}
PanelRowSwitch.displayName = 'Panel.RowSwitch';

export function PanelRowIcon({
  icon,
  iconClassName,
  className,
  ...props
}: PanelRowIconProps) {
  return (
    <div
      className={classMerge(
        'flex size-9 shrink-0 items-center justify-center rounded-control border border-border-neutral-subtle bg-background-neutral-100',
        className,
      )}
      {...props}
    >
      <Icon icon={icon} className={classMerge('size-4', iconClassName)} />
    </div>
  );
}
PanelRowIcon.displayName = 'Panel.RowIcon';

export function PanelRowText({ className, ...props }: PanelRowTextProps) {
  return (
    <div
      className={classMerge('flex min-w-0 flex-1 flex-col gap-1', className)}
      {...props}
    />
  );
}
PanelRowText.displayName = 'Panel.RowText';

export function PanelRowTitle({
  className,
  size,
  weight = 'medium',
  color = 'primary',
  element = 'div',
  ...props
}: PanelRowTitleProps) {
  const { titleId, controlId, disabled, hasControl } = usePanelRow();

  return (
    <label
      htmlFor={controlId}
      className={classMerge(
        'flex w-fit',
        hasControl && (disabled ? 'cursor-not-allowed' : 'cursor-pointer'),
      )}
    >
      <Text
        id={titleId}
        size={size ?? 'sm'}
        weight={weight}
        color={color}
        element={element}
        className={classMerge(
          'flex flex-wrap items-center gap-x-2 gap-y-0.5',
          className,
        )}
        {...props}
      />
    </label>
  );
}
PanelRowTitle.displayName = 'Panel.RowTitle';

export function PanelRowDescription({
  className,
  size = 'xs',
  color = 'secondary',
  ...props
}: PanelRowDescriptionProps) {
  const { descriptionId, setHasDescription } = usePanelRow();

  React.useLayoutEffect(() => {
    setHasDescription(true);
    return () => setHasDescription(false);
  }, [setHasDescription]);

  return (
    <Text
      id={descriptionId}
      size={size}
      color={color}
      className={className}
      {...props}
    />
  );
}
PanelRowDescription.displayName = 'Panel.RowDescription';

const rowBadgeColors = {
  blue: 'bg-[rgba(48,127,246,0.04)] text-[rgb(48,127,246)] ring-[rgba(48,127,246,0.16)] dark:bg-[rgba(48,127,246,0.24)]',
  green:
    'bg-[rgba(46,200,129,0.08)] text-typography-status-success-pressed ring-[rgba(46,200,129,0.28)] dark:bg-[rgba(46,200,129,0.16)]',
  gray: 'bg-[rgba(25,28,33,0.04)] text-typography-neutral-secondary ring-[rgba(25,28,33,0.12)] dark:bg-white/[0.06] dark:ring-white/[0.12]',
  dark: 'bg-background-neutral-inverse text-typography-neutral-inverse ring-black/20 dark:ring-white/20',
  yellow:
    'bg-[rgba(251,193,25,0.10)] text-[rgb(218,146,0)] ring-[rgba(251,193,25,0.36)] dark:bg-[rgba(251,193,25,0.14)]',
  red: 'bg-[rgba(238,65,20,0.06)] text-typography-status-critical-pressed ring-[rgba(238,65,20,0.24)] dark:bg-[rgba(238,65,20,0.14)] dark:text-typography-status-critical-rest',
} as const;

export function PanelRowBadge({
  color = 'blue',
  className,
  ...props
}: PanelRowBadgeProps) {
  return (
    <span
      className={classMerge(
        'inline-flex shrink-0 items-center rounded-sm bg-linear-to-t from-black/[0.02] px-1.5 py-0.5 font-medium text-[11px] leading-[14px] tracking-[0.165px] ring-1 ring-inset',
        rowBadgeColors[color],
        className,
      )}
      {...props}
    />
  );
}
PanelRowBadge.displayName = 'Panel.RowBadge';

export function PanelRowAction({ className, ...props }: PanelRowActionProps) {
  return (
    <div
      className={classMerge(
        'ml-auto flex shrink-0 items-center gap-2 self-center',
        className,
      )}
      {...props}
    />
  );
}
PanelRowAction.displayName = 'Panel.RowAction';
