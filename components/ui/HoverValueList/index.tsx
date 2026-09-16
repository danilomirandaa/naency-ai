import { classMerge } from '@/lib/utils';

import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from '@/components/ui/HoverCard';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Text } from '@/components/ui/Text';

export type HoverValueListProps = {
  children: React.ReactNode[];
  maxVisible?: number;
  className?: string;
  label?: React.ReactNode;
  triggerLabel?: (count: number) => string;
};

export function HoverValueList({
  children,
  maxVisible = 1,
  className,
  label,
  triggerLabel,
}: HoverValueListProps) {
  if (!children?.length) {
    return null;
  }

  const visibleItems = children.slice(0, maxVisible);
  const hiddenItems = children.slice(maxVisible);
  const hasHiddenItems = hiddenItems.length > 0;

  if (!hasHiddenItems) {
    return (
      <div
        className={classMerge('flex flex-wrap items-center gap-2', className)}
      >
        {children.map((child, index) => (
          <div key={index} className="inline-flex">
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={classMerge('flex flex-wrap items-center gap-2', className)}>
      {visibleItems.map((child, index) => (
        <div key={index} className="inline-flex">
          {child}
        </div>
      ))}

      <HoverCard openDelay={150} closeDelay={150}>
        <HoverCardTrigger asChild>
          <Text
            size="xs"
            color="secondary"
            className="cursor-default whitespace-nowrap transition-colors hover:text-typography-neutral-primary"
          >
            {triggerLabel
              ? triggerLabel(hiddenItems.length)
              : `+${hiddenItems.length} more`}
          </Text>
        </HoverCardTrigger>
        <HoverCardPortal>
          <HoverCardContent
            align="end"
            sideOffset={6}
            className="w-64 rounded-2xl border-0 bg-background-surface-sunken p-0.5 shadow-[0_16px_36px_-6px_rgba(25,28,33,0.2),0_8px_16px_-3px_rgba(0,0,0,0.16)] ring-1 ring-black/5 dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.4),0_8px_16px_-3px_rgba(0,0,0,0.4)] dark:ring-black/60"
          >
            {label && (
              <div className="flex items-center justify-between gap-2 px-3 pt-1.5 pb-2">
                <Text size="xs" weight="medium" color="secondary">
                  {label}
                </Text>
                <Text size="xs" color="secondary">
                  {children.length}
                </Text>
              </div>
            )}
            <div className="overflow-hidden rounded-xl border border-border-neutral-subtle bg-background-neutral-000 shadow-xs dark:shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.16)]">
              <ScrollArea viewportClassName="max-h-64">
                <ul className="flex flex-col">
                  {children.map((child, index) => (
                    <li
                      key={index}
                      className="flex min-w-0 items-center border-border-neutral-subtle border-b px-3 py-2 text-xs last:border-b-0 [&_a]:min-w-0 [&_a]:break-normal"
                    >
                      {child}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </HoverCardContent>
        </HoverCardPortal>
      </HoverCard>
    </div>
  );
}
