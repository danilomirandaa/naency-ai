'use client';

import { Icon } from '@/components/ui/Icon';
import { Tooltip } from '@/components/ui/Tooltip';
import { classMerge } from '@/lib/utils';
import type { PanelInfoTipProps } from './types';

export function PanelInfoTip({ content, side, className }: PanelInfoTipProps) {
  return (
    <Tooltip content={content} side={side}>
      <span
        className={classMerge(
          'inline-flex cursor-help text-typography-neutral-secondary transition-colors hover:text-typography-neutral-primary',
          className,
        )}
      >
        <Icon icon="info-icon" className="size-4" />
      </span>
    </Tooltip>
  );
}
PanelInfoTip.displayName = 'Panel.InfoTip';
