'use client';

import * as React from 'react';

export type PanelGroupContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled: boolean;
  contentId: string;
};

export type PanelRowContextValue = {
  checked: boolean;
  setChecked: (checked: boolean) => void;
  disabled: boolean;
  isMaster: boolean;
  controlId: string;
  titleId: string;
  descriptionId: string;
  contentId: string;
  controlsId: string | undefined;
  hasDescription: boolean;
  setHasDescription: (has: boolean) => void;
  setHasContent: (has: boolean) => void;
  hasControl: boolean;
  setHasControl: (has: boolean) => void;
};

export const PanelBodyContext = React.createContext(false);

export const PanelGridContext = React.createContext(false);

export const PanelGroupContext =
  React.createContext<PanelGroupContextValue | null>(null);

export const PanelRowContext = React.createContext<PanelRowContextValue | null>(
  null,
);

export function usePanelGroupOptional() {
  return React.use(PanelGroupContext);
}

export function usePanelGroup() {
  const context = React.use(PanelGroupContext);
  if (!context) {
    throw new Error('Panel.GroupContent must be used inside Panel.Group');
  }
  return context;
}

export function usePanelRow() {
  const context = React.use(PanelRowContext);
  if (!context) {
    throw new Error('Panel.Row parts must be used inside Panel.Row');
  }
  return context;
}

export function useControlledState(
  value: boolean | undefined,
  defaultValue: boolean,
  onChange?: (value: boolean) => void,
): [boolean, (next: boolean) => void] {
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const setValue = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternal(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue];
}
