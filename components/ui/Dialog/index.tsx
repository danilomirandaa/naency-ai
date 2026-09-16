'use client';

import * as React from 'react';

import { classMerge } from '@/lib/utils';

import { Icon } from '@/components/ui/Icon';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '../Button';
import { makeResponsiveDialog } from './ResponsiveDialog';

export { makeResponsiveDialog };
export const Dialog = DialogPrimitive.Root;

export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogPortal = DialogPrimitive.Portal;

export const DialogClose = DialogPrimitive.Close;

const noiseLayerClassName =
  'absolute inset-0 bg-[length:250px_250px] bg-repeat animate-overlay-noise motion-reduce:animate-none';

const NOISE_TILE_SIZE = 250;

let noiseTileUrls: string[] | null = null;

function getNoiseTileUrls() {
  if (noiseTileUrls) {
    return noiseTileUrls;
  }
  const gridStep = 5;
  const dotSize = 2;
  const litChance = 0.25;
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  noiseTileUrls = Array.from({ length: 3 }, () => {
    const tile = document.createElement('canvas');
    tile.width = NOISE_TILE_SIZE * scale;
    tile.height = NOISE_TILE_SIZE * scale;
    const context = tile.getContext('2d');
    if (!context) {
      return '';
    }
    context.scale(scale, scale);
    for (let y = 0; y < NOISE_TILE_SIZE; y += gridStep) {
      for (let x = 0; x < NOISE_TILE_SIZE; x += gridStep) {
        if (Math.random() >= litChance) {
          continue;
        }
        const value = Math.floor(128 + Math.random() * 127);
        const alpha = 0.1 + Math.random() * 0.35;
        context.fillStyle = `rgba(${value},${value},${value},${alpha})`;
        context.fillRect(x, y, dotSize, dotSize);
      }
    }
    return `url(${tile.toDataURL()})`;
  });
  return noiseTileUrls;
}

function OverlayNoise() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const wrapper = ref.current;
    if (!wrapper) {
      return;
    }
    const tiles = getNoiseTileUrls();
    wrapper
      .querySelectorAll<HTMLDivElement>('[data-noise-layer]')
      .forEach((layer, index) => {
        layer.style.backgroundImage = tiles[index] ?? '';
      });
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-20"
    >
      <div data-noise-layer="" className={noiseLayerClassName} />
      <div
        data-noise-layer=""
        className={classMerge(
          noiseLayerClassName,
          'opacity-0 [animation-delay:-2s]',
        )}
      />
      <div
        data-noise-layer=""
        className={classMerge(
          noiseLayerClassName,
          'opacity-0 [animation-delay:-4s]',
        )}
      />
    </div>
  );
}

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={classMerge(
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 isolate z-50 bg-black/40 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in',
      className,
    )}
    {...props}
  >
    <OverlayNoise />
    {children}
  </DialogPrimitive.Overlay>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    closeClassName?: string;
    hideClose?: boolean;
  }
>(({ className, children, closeClassName, hideClose, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-5 py-[min(10vh,10rem)]">
      <DialogPrimitive.Content
        ref={ref}
        className={classMerge(
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 relative isolate flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-background-surface-sunken p-0.5 text-typography-neutral-primary shadow-[0_32px_72px_-12px_rgba(25,28,33,0.2),0_16px_32px_-6px_rgba(0,0,0,0.2)] ring-1 ring-black/5 duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in dark:shadow-[0_32px_72px_-12px_rgba(0,0,0,0.4),0_16px_32px_-6px_rgba(0,0,0,0.4)] dark:ring-black/60',
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close asChild>
            <Button
              title="Close"
              type="button"
              variant="standalone"
              size="icon"
              icon={<Icon className="size-4" icon="close" />}
              className={classMerge(
                'absolute top-5 right-4 flex h-6 w-6 items-center justify-center rounded-[8px] text-typography-neutral-secondary hover:bg-background-neutral-100',
                closeClassName,
              )}
            />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </div>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={classMerge(
      'flex flex-col overflow-hidden rounded-[14px] border border-border-neutral-subtle bg-background-neutral-000 shadow-xs dark:shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.16)]',
      className,
    )}
    {...props}
  />
);
DialogBody.displayName = 'DialogBody';

export const DialogHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={classMerge(
      'flex flex-col gap-0.5 border-border-neutral-subtle border-b px-5 py-4 text-left',
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
DialogHeader.displayName = 'DialogHeader';

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={classMerge('flex flex-row justify-end gap-3 p-4', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={classMerge(
      'font-medium text-base text-typography-neutral-primary',
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={classMerge(
      'text-sm text-typography-neutral-secondary',
      className,
    )}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export function makeDialog({
  children,
  footer,
  title,
  dialogProps,
  contentDialogProps,
  footerDialogProps,
  trigger,
  description,
  hideClose,
  accessibleTitle = 'Dialog',
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  title?: string | React.ReactNode;
  onClose?: () => void;
  dialogProps?: Parameters<typeof Dialog>[0];
  contentDialogProps?: Parameters<typeof DialogContent>[0];
  footerDialogProps?: Parameters<typeof DialogFooter>[0];
  trigger?: React.ReactNode;
  description?: React.ReactNode;
  hideClose?: boolean;
  accessibleTitle?: string;
}) {
  return (
    <Dialog {...dialogProps}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        hideClose={hideClose}
        {...(!description && { 'aria-describedby': undefined })}
        {...contentDialogProps}
        className={classMerge('max-h-full', contentDialogProps?.className)}
      >
        <DialogBody>
          {!title && (
            <DialogTitle className="sr-only">{accessibleTitle}</DialogTitle>
          )}
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && (
                <DialogDescription className="text-xs">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
          )}
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        </DialogBody>
        {footer && <DialogFooter {...footerDialogProps}>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
