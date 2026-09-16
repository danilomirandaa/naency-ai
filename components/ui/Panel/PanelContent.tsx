import { classMerge } from '@/lib/utils';
import type { PanelContentProps } from './types';

export function PanelContent({ className, ...props }: PanelContentProps) {
  return (
    <div className={classMerge('flex-1 px-6 py-5', className)} {...props} />
  );
}
PanelContent.displayName = 'Panel.Content';
