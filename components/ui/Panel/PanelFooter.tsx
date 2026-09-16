import { classMerge } from '@/lib/utils';
import type {
  PanelFooterEndProps,
  PanelFooterLinkProps,
  PanelFooterProps,
  PanelFooterStartProps,
  PanelLinkProps,
} from './types';

export function PanelFooter({ className, ...props }: PanelFooterProps) {
  return (
    <div
      className={classMerge(
        'flex items-center justify-between gap-4 border-border-neutral-subtle border-t px-5 pt-4 pb-3 font-inter text-typography-neutral-secondary text-xs [[data-panel-body]+&]:border-t-0 [[data-panel-group][data-state=open]+&]:border-t-0',
        className,
      )}
      {...props}
    />
  );
}
PanelFooter.displayName = 'Panel.Footer';

export function PanelFooterStart({
  className,
  ...props
}: PanelFooterStartProps) {
  return (
    <div
      className={classMerge('flex items-center gap-1.5', className)}
      {...props}
    />
  );
}
PanelFooterStart.displayName = 'Panel.FooterStart';

export function PanelFooterEnd({ className, ...props }: PanelFooterEndProps) {
  return (
    <div
      className={classMerge('ml-auto flex items-center gap-1.5', className)}
      {...props}
    />
  );
}
PanelFooterEnd.displayName = 'Panel.FooterEnd';

export function PanelFooterLink({ className, ...props }: PanelFooterLinkProps) {
  return (
    <a
      className={classMerge(
        'inline-flex cursor-pointer items-center gap-1.5 font-medium transition-colors hover:text-typography-neutral-primary',
        className,
      )}
      {...props}
    />
  );
}
PanelFooterLink.displayName = 'Panel.FooterLink';

export function PanelLink({ className, ...props }: PanelLinkProps) {
  return (
    <a
      className={classMerge(
        'cursor-pointer font-medium text-typography-brand-primary-rest underline-offset-2 transition-colors hover:text-typography-brand-primary-hover hover:underline',
        className,
      )}
      {...props}
    />
  );
}
PanelLink.displayName = 'Panel.Link';
