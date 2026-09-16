import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { classMerge } from '@/lib/utils';
import type { PanelEmptyStateProps } from './types';

export function PanelEmptyState({
  icon,
  title,
  description,
  children,
  className,
  ...props
}: PanelEmptyStateProps) {
  return (
    <div
      className={classMerge(
        'flex flex-col items-center px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 flex size-11 items-center justify-center rounded-control border border-border-neutral-subtle bg-background-neutral-100">
          <Icon icon={icon} className="size-5" />
        </div>
      )}
      <Text size="sm" weight="medium">
        {title}
      </Text>
      {description && (
        <Text size="xs" color="secondary" className="mt-1 max-w-sm">
          {description}
        </Text>
      )}
      {children && (
        <div className="mt-4 flex items-center gap-2">{children}</div>
      )}
    </div>
  );
}
PanelEmptyState.displayName = 'Panel.EmptyState';
