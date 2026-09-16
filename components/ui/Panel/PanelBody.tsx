'use client';

import { classMerge } from '@/lib/utils';
import { PanelBodyContext } from './PanelContext';
import type { PanelBodyProps } from './types';

export function PanelBody({ className, ...props }: PanelBodyProps) {
  return (
    <PanelBodyContext.Provider value={true}>
      <div
        data-panel-body=""
        className={classMerge(
          'mx-0.5 flex flex-col overflow-hidden rounded-[14px] bg-background-neutral-000 shadow-panel-body ring-1 ring-[rgba(25,28,33,0.04)] dark:shadow-panel-body-dark dark:ring-black/20',
          className,
        )}
        {...props}
      />
    </PanelBodyContext.Provider>
  );
}
PanelBody.displayName = 'Panel.Body';
