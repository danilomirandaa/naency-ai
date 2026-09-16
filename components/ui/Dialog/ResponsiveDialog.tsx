import type {
  DialogContent,
  DialogFooter,
} from '@/components/ui/Dialog';
import { makeDialog } from '@/components/ui/Dialog';
import type React from 'react';

export function makeResponsiveDialog({
  children,
  footer,
  title,
  onClose,
  trigger,
  description,
  open,
  onOpenChange,
  contentProps,
  footerProps,
  className,
  dismissible = true,
  hideClose,
  accessibleTitle,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  title?: string | React.ReactNode;
  onClose?: () => void;
  trigger?: React.ReactNode;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentProps?: React.ComponentPropsWithoutRef<typeof DialogContent>;
  footerProps?: React.ComponentPropsWithoutRef<typeof DialogFooter>;
  className?: string;
  dismissible?: boolean;
  hideClose?: boolean;
  accessibleTitle?: string;
}) {
  return makeDialog({
    title,
    onClose,
    children,
    footer,
    trigger,
    description,
    hideClose,
    accessibleTitle,
    dialogProps: {
      open,
      onOpenChange,
    },
    contentDialogProps: {
      className,
      ...(!dismissible && {
        onPointerDownOutside: (event: Event) => event.preventDefault(),
        onInteractOutside: (event: Event) => event.preventDefault(),
        onEscapeKeyDown: (event: KeyboardEvent) => event.preventDefault(),
      }),
      ...contentProps,
    },
    footerDialogProps: footerProps,
  });
}
