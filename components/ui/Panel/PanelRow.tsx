'use client';

import { classMerge } from '@/lib/utils';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import * as React from 'react';
import {
  PanelBodyContext,
  PanelRowContext,
  useControlledState,
  usePanelGroupOptional,
  usePanelRow,
} from './PanelContext';
import type {
  PanelRowContentProps,
  PanelRowHeaderProps,
  PanelRowProps,
} from './types';

export function PanelRow({
  className,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  bindGroup = false,
  ...props
}: PanelRowProps) {
  const group = usePanelGroupOptional();
  const inBody = React.use(PanelBodyContext);
  const [localChecked, setLocalChecked] = useControlledState(
    checked,
    defaultChecked,
    onCheckedChange,
  );

  const boundToGroup = bindGroup && group !== null;
  const isMaster = !inBody;
  const isChecked = boundToGroup ? group.open : localChecked;
  const setChecked = boundToGroup ? group.setOpen : setLocalChecked;
  const isDisabled = disabled || (boundToGroup && group.disabled);

  const id = React.useId();
  const [hasDescription, setHasDescription] = React.useState(false);
  const [hasContent, setHasContent] = React.useState(false);
  const [hasControl, setHasControl] = React.useState(false);

  const contentId = `${id}-content`;
  const controlsId = hasContent
    ? contentId
    : boundToGroup
      ? group.contentId
      : undefined;

  const value = React.useMemo(
    () => ({
      checked: isChecked,
      setChecked,
      disabled: isDisabled,
      isMaster,
      controlId: `${id}-control`,
      titleId: `${id}-title`,
      descriptionId: `${id}-description`,
      contentId,
      controlsId,
      hasDescription,
      setHasDescription,
      setHasContent,
      hasControl,
      setHasControl,
    }),
    [
      isChecked,
      setChecked,
      isDisabled,
      isMaster,
      id,
      contentId,
      controlsId,
      hasDescription,
      hasControl,
    ],
  );

  return (
    <PanelRowContext.Provider value={value}>
      <CollapsiblePrimitive.Root
        open={isChecked}
        className={classMerge(
          isMaster
            ? 'flex flex-col px-6 py-4'
            : 'flex flex-col border-border-neutral-subtle border-t px-5 py-6 first:border-t-0',
          className,
        )}
        {...props}
      />
    </PanelRowContext.Provider>
  );
}
PanelRow.displayName = 'Panel.Row';

export function PanelRowHeader({ className, ...props }: PanelRowHeaderProps) {
  return (
    <div
      className={classMerge('flex items-start gap-2', className)}
      {...props}
    />
  );
}
PanelRowHeader.displayName = 'Panel.RowHeader';

export function PanelRowContent({
  className,
  children,
  ...props
}: PanelRowContentProps) {
  const { contentId, setHasContent } = usePanelRow();

  React.useLayoutEffect(() => {
    setHasContent(true);
    return () => setHasContent(false);
  }, [setHasContent]);

  return (
    <CollapsiblePrimitive.Content
      id={contentId}
      className={classMerge(
        'overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-3 pt-2 pl-8">{children}</div>
    </CollapsiblePrimitive.Content>
  );
}
PanelRowContent.displayName = 'Panel.RowContent';
