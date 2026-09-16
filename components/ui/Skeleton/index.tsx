import { classMerge } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={classMerge(
        'animate-pulse rounded-control bg-background-neutral-200',
        className,
      )}
      {...props}
    />
  );
}
