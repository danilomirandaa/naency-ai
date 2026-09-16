import { Text } from '@/components/ui/Text';
import { classMerge } from '@/lib/utils';
import type {
  PanelDescriptionProps,
  PanelHeaderActionProps,
  PanelHeaderProps,
  PanelHeaderTextProps,
  PanelLabelRowProps,
  PanelTitleProps,
} from './types';

export function PanelHeader({ className, ...props }: PanelHeaderProps) {
  return (
    <div
      className={classMerge(
        'flex flex-wrap items-center justify-between gap-4 border-border-neutral-subtle px-6 py-4 [&:has(+[data-panel-label-row])]:border-b [&:has(+[data-panel-main]>[data-panel-label-row]:first-child)]:border-b [&:has(+[data-panel-main]>[data-panel-table]:first-child)]:border-b [&:has(+[data-panel-table])]:border-b',
        className,
      )}
      {...props}
    />
  );
}
PanelHeader.displayName = 'Panel.Header';

export function PanelTitle({
  className,
  size = 'sm',
  weight = 'medium',
  color = 'primary',
  element = 'h3',
  ...props
}: PanelTitleProps) {
  return (
    <Text
      size={size}
      weight={weight}
      color={color}
      element={element}
      className={classMerge('flex min-w-0 items-center gap-2', className)}
      {...props}
    />
  );
}
PanelTitle.displayName = 'Panel.Title';

export function PanelDescription({
  className,
  size = 'xs',
  color = 'secondary',
  ...props
}: PanelDescriptionProps) {
  return <Text size={size} color={color} className={className} {...props} />;
}
PanelDescription.displayName = 'Panel.Description';

export function PanelHeaderText({ className, ...props }: PanelHeaderTextProps) {
  return (
    <div
      className={classMerge('flex min-w-0 flex-1 flex-col gap-1', className)}
      {...props}
    />
  );
}
PanelHeaderText.displayName = 'Panel.HeaderText';

export function PanelHeaderAction({
  className,
  ...props
}: PanelHeaderActionProps) {
  return (
    <div
      className={classMerge(
        'flex min-w-0 basis-full items-center gap-2 sm:max-w-[50%] sm:basis-auto',
        className,
      )}
      {...props}
    />
  );
}
PanelHeaderAction.displayName = 'Panel.HeaderAction';

export function PanelLabelRow({ className, ...props }: PanelLabelRowProps) {
  return (
    <div
      data-panel-label-row=""
      className={classMerge(
        'flex items-center justify-between gap-4 px-6 pt-3 pb-3 font-inter text-typography-neutral-secondary text-xs',
        className,
      )}
      {...props}
    />
  );
}
PanelLabelRow.displayName = 'Panel.LabelRow';
