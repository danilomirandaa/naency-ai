'use client';

import { classMerge } from '@/lib/utils';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import * as React from 'react';
import {
  PanelGroupContext,
  useControlledState,
  usePanelGroup,
} from './PanelContext';
import type { PanelGroupContentProps, PanelGroupProps } from './types';

export function PanelGroup({
  className,
  open,
  defaultOpen = true,
  onOpenChange,
  disabled = false,
  ...props
}: PanelGroupProps) {
  const [isOpen, setOpen] = useControlledState(open, defaultOpen, onOpenChange);
  const contentId = React.useId();

  const value = React.useMemo(
    () => ({ open: isOpen, setOpen, disabled, contentId }),
    [isOpen, setOpen, disabled, contentId],
  );

  return (
    <PanelGroupContext.Provider value={value}>
      <CollapsiblePrimitive.Root
        data-panel-group=""
        open={isOpen}
        onOpenChange={setOpen}
        disabled={disabled}
        className={classMerge('flex flex-col', className)}
        {...props}
      />
    </PanelGroupContext.Provider>
  );
}
PanelGroup.displayName = 'Panel.Group';

export function PanelGroupContent({
  className,
  children,
  ...props
}: PanelGroupContentProps) {
  const { contentId } = usePanelGroup();

  return (
    <CollapsiblePrimitive.Content
      id={contentId}
      className={classMerge(
        'overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
        className,
      )}
      {...props}
    >
      {children}
    </CollapsiblePrimitive.Content>
  );
}
PanelGroupContent.displayName = 'Panel.GroupContent';
