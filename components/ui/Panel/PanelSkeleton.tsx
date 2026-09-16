import { Skeleton } from '@/components/ui/Skeleton';
import { classMerge } from '@/lib/utils';
import type {
  PanelChartSkeletonProps,
  PanelGaugeSkeletonProps,
  PanelHeaderSkeletonProps,
  PanelRowSkeletonProps,
} from './types';

export function PanelRowSkeleton({
  withDescription = true,
  className,
  ...props
}: PanelRowSkeletonProps) {
  return (
    <div
      className={classMerge('flex items-start gap-2 px-6 py-4', className)}
      {...props}
    >
      <Skeleton className="h-4 w-6 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-40 max-w-full" />
        {withDescription && <Skeleton className="h-3.5 w-64 max-w-full" />}
      </div>
    </div>
  );
}
PanelRowSkeleton.displayName = 'Panel.RowSkeleton';

export function PanelHeaderSkeleton({
  className,
  ...props
}: PanelHeaderSkeletonProps) {
  return (
    <div
      className={classMerge(
        'flex items-center justify-between gap-4 px-6 py-4',
        className,
      )}
      {...props}
    >
      <Skeleton className="h-5 w-48 max-w-full" />
      <Skeleton className="h-5 w-20" />
    </div>
  );
}
PanelHeaderSkeleton.displayName = 'Panel.HeaderSkeleton';

export function PanelChartSkeleton({
  className,
  ...props
}: PanelChartSkeletonProps) {
  return (
    <Skeleton
      className={classMerge(
        'h-full min-h-32 w-full flex-1 self-stretch',
        className,
      )}
      {...props}
    />
  );
}
PanelChartSkeleton.displayName = 'Panel.ChartSkeleton';

export function PanelGaugeSkeleton({
  className,
  ...props
}: PanelGaugeSkeletonProps) {
  return (
    <Skeleton
      className={classMerge(
        'aspect-square w-full max-w-[220px] rounded-full',
        className,
      )}
      {...props}
    />
  );
}
PanelGaugeSkeleton.displayName = 'Panel.GaugeSkeleton';
