import { classMerge } from '@/lib/utils';
import type { PanelDividerLabelProps, PanelRowGroupProps } from './types';

export function PanelRowGroup({ className, ...props }: PanelRowGroupProps) {
  return <div className={classMerge('flex flex-col', className)} {...props} />;
}
PanelRowGroup.displayName = 'Panel.RowGroup';

export function PanelDividerLabel({
  className,
  children,
  ...props
}: PanelDividerLabelProps) {
  return (
    <div
      className={classMerge('relative z-10 flex items-center', className)}
      {...props}
    >
      <span className="w-3 shrink-0 border-border-neutral-rest border-t border-dashed" />
      <span className="-my-3 inline-flex shrink-0 items-center rounded-full border border-border-neutral-rest border-dashed bg-background-neutral-000 px-2.5 py-1 font-inter text-[11px] text-typography-neutral-secondary leading-[14px]">
        {children}
      </span>
      <span className="flex-1 border-border-neutral-rest border-t border-dashed" />
    </div>
  );
}
PanelDividerLabel.displayName = 'Panel.DividerLabel';
