import { Icon } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';
import type { PanelCalloutProps } from './types';

export function PanelCallout({
  icon = 'info-square',
  variant = 'neutral',
  className,
  children,
  ...props
}: PanelCalloutProps) {
  return (
    <div
      className={classMerge(
        'mt-2 flex items-start gap-2 rounded-control border px-3 py-2 font-inter text-xs',
        variant === 'warning' &&
          'border-yellow-500/40 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/20 dark:text-yellow-200',
        variant === 'critical' &&
          'border-red-500/40 bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-200',
        variant === 'neutral' &&
          'border-border-neutral-subtle bg-background-neutral-100 text-typography-neutral-secondary',
        className,
      )}
      {...props}
    >
      <Icon
        icon={icon}
        className={classMerge(
          'mt-px size-3.5 shrink-0',
          variant === 'warning' && 'text-yellow-600 dark:text-yellow-400',
          variant === 'critical' && 'text-red-600 dark:text-red-400',
        )}
      />
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}
PanelCallout.displayName = 'Panel.Callout';
