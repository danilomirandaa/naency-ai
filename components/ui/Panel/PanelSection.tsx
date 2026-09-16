import { Text } from '@/components/ui/Text';
import { classMerge } from '@/lib/utils';
import type {
  PanelSectionDescriptionProps,
  PanelSectionProps,
  PanelSectionTitleProps,
} from './types';

export function PanelSection({ className, ...props }: PanelSectionProps) {
  return (
    <div
      className={classMerge('flex flex-col gap-0.5', className)}
      {...props}
    />
  );
}
PanelSection.displayName = 'Panel.Section';

export function PanelSectionTitle({
  className,
  size = 'sm',
  weight = 'medium',
  color = 'primary',
  ...props
}: PanelSectionTitleProps) {
  return (
    <Text
      size={size}
      weight={weight}
      color={color}
      className={className}
      {...props}
    />
  );
}
PanelSectionTitle.displayName = 'Panel.SectionTitle';

export function PanelSectionDescription({
  className,
  size = 'xs',
  color = 'secondary',
  ...props
}: PanelSectionDescriptionProps) {
  return <Text size={size} color={color} className={className} {...props} />;
}
PanelSectionDescription.displayName = 'Panel.SectionDescription';
