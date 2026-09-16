import { classMerge } from '@/lib/utils';
import { PanelEmptyState } from './PanelEmptyState';
import { PanelChartSkeleton } from './PanelSkeleton';
import type { PanelQueryStateProps } from './types';

export function PanelQueryState({
  isLoading = false,
  isError = false,
  isEmpty = false,
  skeleton,
  errorIcon = 'alert-circle',
  errorMessage = 'Failed to load data',
  errorDescription,
  errorAction,
  emptyIcon = 'inbox',
  emptyMessage = 'No results found',
  emptyDescription,
  emptyAction,
  className,
  children,
  ...props
}: PanelQueryStateProps) {
  if (!isLoading && !isError && !isEmpty) {
    return <>{children}</>;
  }

  return (
    <div
      className={classMerge(
        'flex min-h-0 w-full flex-1 flex-col items-center justify-center',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        (skeleton ?? <PanelChartSkeleton />)
      ) : isError ? (
        <PanelEmptyState
          icon={errorIcon}
          title={errorMessage}
          description={errorDescription}
          className="py-6"
        >
          {errorAction}
        </PanelEmptyState>
      ) : (
        <PanelEmptyState
          icon={emptyIcon}
          title={emptyMessage}
          description={emptyDescription}
          className="py-6"
        >
          {emptyAction}
        </PanelEmptyState>
      )}
    </div>
  );
}
PanelQueryState.displayName = 'Panel.QueryState';
