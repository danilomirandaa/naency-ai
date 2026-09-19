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
          // Naency: sem anel de contorno; o cartão se separa pelo fundo e pela sombra.
          'mx-0.5 flex flex-col overflow-hidden rounded-[14px] bg-background-neutral-000 shadow-panel-body dark:shadow-panel-body-dark',
          className,
        )}
        {...props}
      />
    </PanelBodyContext.Provider>
  );
}
PanelBody.displayName = 'Panel.Body';
