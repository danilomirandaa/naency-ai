'use client';

import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { classMerge } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import type {
  PanelNavItemProps,
  PanelNavListProps,
  PanelSplitProps,
  PanelStatProps,
  PanelStatsProps,
  PanelToolbarEndProps,
  PanelToolbarProps,
  PanelToolbarStartProps,
  PanelViewProps,
} from './types';

export function PanelStats({ className, ...props }: PanelStatsProps) {
  return (
    <div
      data-panel-stats=""
      className={classMerge(
        'grid grid-cols-2 gap-px border-border-neutral-subtle border-b bg-border-neutral-subtle md:auto-cols-fr md:grid-flow-col',
        className,
      )}
      {...props}
    />
  );
}
PanelStats.displayName = 'Panel.Stats';

export function PanelStat({
  label,
  value,
  icon,
  color,
  selected = false,
  className,
  disabled,
  onClick,
  ...props
}: PanelStatProps) {
  const interactive = !!onClick && !disabled;

  return (
    <button
      type="button"
      data-panel-stat=""
      data-selected={selected || undefined}
      aria-pressed={onClick ? selected : undefined}
      tabIndex={onClick ? undefined : -1}
      disabled={disabled}
      onClick={onClick}
      className={classMerge(
        'group/stat relative flex min-w-0 items-center gap-3 bg-background-neutral-000 px-5 py-3 text-left outline-hidden transition-colors',
        interactive
          ? 'cursor-pointer hover:bg-background-neutral-100 focus-visible:bg-background-neutral-100'
          : 'cursor-default',
        disabled && 'opacity-60',
        selected && 'bg-background-neutral-100',
        className,
      )}
      {...props}
    >
      {icon ? (
        <span
          className={classMerge(
            'flex size-8 shrink-0 items-center justify-center rounded-control border border-border-neutral-subtle bg-background-neutral-000 text-typography-neutral-secondary transition-colors',
            interactive &&
              'group-hover/stat:border-border-neutral-rest group-hover/stat:text-typography-neutral-primary',
            selected &&
              'border-border-neutral-rest text-typography-neutral-primary',
          )}
        >
          <Icon icon={icon} className="size-4" />
        </span>
      ) : color ? (
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <Text size="xs" weight="medium" color="secondary" className="truncate">
          {label}
        </Text>
        <Text size="sm" weight="semibold" className="truncate tabular-nums">
          {value}
        </Text>
      </span>
      {selected && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 bg-background-brand-primary-rest"
        />
      )}
    </button>
  );
}
PanelStat.displayName = 'Panel.Stat';

export function PanelToolbar({ className, ...props }: PanelToolbarProps) {
  return (
    <div
      data-panel-toolbar=""
      className={classMerge(
        'flex min-h-12 items-center justify-between gap-3 border-border-neutral-subtle border-b px-5 py-2.5',
        className,
      )}
      {...props}
    />
  );
}
PanelToolbar.displayName = 'Panel.Toolbar';

export function PanelToolbarStart({
  className,
  ...props
}: PanelToolbarStartProps) {
  return (
    <div
      className={classMerge(
        'flex min-w-0 flex-1 items-center gap-2',
        className,
      )}
      {...props}
    />
  );
}
PanelToolbarStart.displayName = 'Panel.ToolbarStart';

export function PanelToolbarEnd({ className, ...props }: PanelToolbarEndProps) {
  return (
    <div
      className={classMerge(
        'ml-auto flex shrink-0 items-center gap-2',
        className,
      )}
      {...props}
    />
  );
}
PanelToolbarEnd.displayName = 'Panel.ToolbarEnd';

export function PanelSplit({ className, ...props }: PanelSplitProps) {
  return (
    <div
      data-panel-split=""
      className={classMerge(
        'grid min-h-0 flex-1 grid-cols-1 divide-y divide-border-neutral-subtle md:grid-cols-2 md:divide-x md:divide-y-0 [&>*]:min-w-0',
        className,
      )}
      {...props}
    />
  );
}
PanelSplit.displayName = 'Panel.Split';

export function PanelNavList({ className, ...props }: PanelNavListProps) {
  return (
    <div
      role="list"
      data-panel-nav-list=""
      className={classMerge(
        'flex flex-col divide-y divide-border-neutral-subtle',
        className,
      )}
      {...props}
    />
  );
}
PanelNavList.displayName = 'Panel.NavList';

export function PanelNavItem({
  title,
  description,
  accentColor,
  icon,
  trailing,
  selected = false,
  showChevron = true,
  className,
  disabled,
  onClick,
  ...props
}: PanelNavItemProps) {
  const interactive = !!onClick && !disabled;

  return (
    <button
      type="button"
      role="listitem"
      data-panel-nav-item=""
      data-selected={selected || undefined}
      aria-current={selected ? 'true' : undefined}
      tabIndex={onClick ? undefined : -1}
      disabled={disabled}
      onClick={onClick}
      className={classMerge(
        'group/nav-item relative flex w-full min-w-0 items-center gap-3 bg-background-neutral-000 px-5 py-3 text-left outline-hidden transition-colors',
        interactive
          ? 'cursor-pointer hover:bg-background-neutral-100 focus-visible:bg-background-neutral-100'
          : 'cursor-default',
        disabled && 'opacity-60',
        selected && 'bg-background-neutral-100',
        className,
      )}
      {...props}
    >
      {accentColor && (
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 w-0.5 rounded-r-full"
          style={{ backgroundColor: accentColor }}
        />
      )}
      {icon && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-control border border-border-neutral-subtle bg-background-neutral-000 text-typography-neutral-secondary">
          <Icon icon={icon} className="size-4" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Text size="xs" weight="medium" className="block truncate">
          {title}
        </Text>
        {description && (
          <Text size="xs" color="secondary" className="block truncate">
            {description}
          </Text>
        )}
      </span>
      {trailing && (
        <span className="flex shrink-0 items-center gap-2">{trailing}</span>
      )}
      {interactive && showChevron && (
        <Icon
          icon="chevron-right"
          className="size-4 shrink-0 text-typography-neutral-secondary transition-transform group-hover/nav-item:translate-x-0.5"
        />
      )}
    </button>
  );
}
PanelNavItem.displayName = 'Panel.NavItem';

export function PanelView({
  viewKey,
  className,
  children,
  ...props
}: PanelViewProps) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={viewKey}
        data-panel-view={viewKey}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={classMerge(
          'relative flex min-h-0 flex-1 flex-col overflow-hidden',
          className,
        )}
        {...props}
      >
        <div className="flex min-h-0 flex-1 flex-col md:absolute md:inset-0">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
PanelView.displayName = 'Panel.View';
