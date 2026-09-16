import { Icon } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as React from 'react';

type DropdownMenuContentVariant = 'default' | 'panel';

const panelShellClassName =
  'rounded-2xl border-0 bg-background-surface-sunken p-0.5 shadow-[0_16px_36px_-6px_rgba(25,28,33,0.2),0_8px_16px_-3px_rgba(0,0,0,0.16)] ring-1 ring-black/5 dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.4),0_8px_16px_-3px_rgba(0,0,0,0.4)] dark:ring-black/60';

const panelInnerClassName =
  'rounded-xl border border-border-neutral-subtle bg-background-neutral-000 p-1 shadow-xs dark:shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.16)]';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => {
  const isRtl = props.dir ? props.dir === 'rtl' : true;
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={classMerge(
        'flex cursor-default select-none items-center gap-2 rounded-control px-2 py-1.5 text-sm outline-hidden focus:bg-background-neutral-100 data-[state=open]:bg-background-neutral-100 [&>svg]:size-4 [&>svg]:shrink-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        inset && 'pl-8',
        className,
      )}
      {...props}
    >
      {!isRtl && <Icon icon="chevron-left" className="mr-auto" />}
      {children}
      {isRtl && <Icon icon="chevron-right" className="ml-auto" />}
    </DropdownMenuPrimitive.SubTrigger>
  );
});
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & {
    variant?: DropdownMenuContentVariant;
  }
>(({ className, variant = 'panel', children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={classMerge(
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-control-lg border border-border-neutral-subtle bg-background-neutral-000 p-1 text-typography-neutral-primary shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in',
      variant === 'panel' && panelShellClassName,
      className,
    )}
    {...props}
  >
    {variant === 'panel' ? (
      <div className={panelInnerClassName}>{children}</div>
    ) : (
      children
    )}
  </DropdownMenuPrimitive.SubContent>
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    /**
     * Skip the exit animation so the content unmounts in the same commit it
     * closes. Use when the trigger may unmount on select (e.g. a list row that
     * is removed/moved), otherwise the popper loses its anchor and jumps to the
     * top-left corner mid-animation.
     */
    noExitAnimation?: boolean;
    variant?: DropdownMenuContentVariant;
  }
>(
  (
    {
      className,
      sideOffset = 4,
      noExitAnimation = false,
      variant = 'panel',
      children,
      ...props
    },
    ref,
  ) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={classMerge(
          'z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-control-lg border border-border-neutral-subtle bg-background-neutral-000 p-1 text-typography-neutral-primary shadow-md',
          'data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin) data-[state=open]:animate-in',
          !noExitAnimation &&
            'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out',
          variant === 'panel' && panelShellClassName,
          className,
        )}
        {...props}
      >
        {variant === 'panel' ? (
          <div className={panelInnerClassName}>{children}</div>
        ) : (
          children
        )}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  ),
);
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={classMerge(
      'relative flex cursor-default select-none items-center gap-2 rounded-control px-2 py-1.5 text-sm outline-hidden transition-colors focus:bg-background-neutral-100 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={classMerge(
      'relative flex cursor-default select-none items-center rounded-control py-1.5 pr-2 pl-8 text-sm outline-hidden transition-colors focus:bg-background-neutral-100 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Icon icon="check" className="size-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={classMerge(
      'relative flex cursor-default select-none items-center rounded-control py-1.5 pr-2 pl-8 text-sm outline-hidden transition-colors focus:bg-background-neutral-100 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <span className="block size-2 rounded-full bg-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={classMerge(
      'px-2 py-1.5 font-semibold text-sm',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={classMerge(
      '-mx-1 my-1 h-px bg-border-neutral-subtle',
      className,
    )}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={classMerge(
        'ml-auto text-xs tracking-widest opacity-60',
        className,
      )}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
