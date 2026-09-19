'use client';

import { classMerge } from '@/lib/utils';
import * as React from 'react';
import { PanelGridContext } from './PanelContext';
import type { PanelGridProps, PanelMainProps, PanelRootProps } from './types';

export function PanelRoot({ className, ...props }: PanelRootProps) {
  const inGrid = React.use(PanelGridContext);
  return (
    <div
      className={classMerge(
        // Naency: sem borda no cartão; o contraste entre o fundo afundado e o corpo já separa.
        'flex flex-col rounded-2xl bg-background-surface-sunken py-0.5',
        inGrid && 'row-span-2 grid grid-cols-[minmax(0,1fr)] grid-rows-subgrid gap-y-0',
        className,
      )}
      {...props}
    />
  );
}
PanelRoot.displayName = 'Panel.Root';

export function PanelFixedRoot({ className, ...props }: PanelRootProps) {
  return <PanelRoot className={classMerge('h-[calc(100vh-10rem)] min-h-[810px]', className)} {...props} />;
}
PanelFixedRoot.displayName = 'Panel.FixedRoot';

export function PanelMain({ className, ...props }: PanelMainProps) {
  return <div data-panel-main="" className={classMerge('flex min-h-0 flex-1 flex-col', className)} {...props} />;
}
PanelMain.displayName = 'Panel.Main';

export function PanelGrid({ className, ...props }: PanelGridProps) {
  return (
    <PanelGridContext.Provider value={true}>
      <div
        className={classMerge(
          'grid grid-cols-1 gap-4 xl:grid-cols-2 xl:[&>*:nth-child(odd):last-child]:col-span-2',
          className,
        )}
        {...props}
      />
    </PanelGridContext.Provider>
  );
}
PanelGrid.displayName = 'Panel.Grid';
