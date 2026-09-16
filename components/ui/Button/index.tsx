import { Icon } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import Link from 'next/link';
import * as React from 'react';

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-control bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-hidden select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        filled:
          'bg-button-brand-primary-rest text-typography-brand-on-primary hover:bg-button-brand-primary-hover active:bg-button-brand-primary-pressed',
        outline:
          'bg-button-subtle-rest hover:bg-button-subtle-hover active:bg-button-subtle-pressed border border-border-neutral-rest text-typography-neutral-primary [&_svg]:text-icon-neutral-rest',
        standalone:
          'bg-button-subtle-rest hover:bg-button-subtle-hover active:bg-button-subtle-pressed text-typography-neutral-primary [&_svg]:text-icon-neutral-rest',
      },
      colors: {
        primary:
          'bg-button-brand-primary-rest text-typography-brand-on-primary hover:bg-button-brand-primary-hover active:bg-button-brand-primary-pressed',
        secondary:
          'bg-button-brand-accent-rest text-typography-neutral-on-color-inverse hover:bg-button-brand-accent-hover active:bg-button-brand-accent-pressed [&_svg]:text-icon-neutral-on-color-inverse',
        critical:
          'bg-button-status-critical-rest text-typography-neutral-on-color hover:bg-button-status-critical-hover active:bg-button-status-critical-pressed',
        success:
          'bg-icon-status-success-rest text-typography-neutral-on-color hover:bg-icon-status-success-hover active:bg-icon-status-success-pressed',
        warning:
          'bg-icon-status-warning-rest text-typography-neutral-on-color hover:bg-icon-status-warning-hover active:bg-icon-status-warning-pressed',
        neutral:
          'bg-icon-neutral-rest text-typography-neutral-on-color hover:bg-icon-neutral-hover active:bg-icon-neutral-pressed',
        'standalone-brand':
          'text-typography-brand-primary-rest hover:text-typography-brand-primary-hover active:text-typography-brand-primary-pressed [&_svg]:text-icon-brand-primary-rest hover:[&_svg]:text-icon-brand-primary-hover active:[&_svg]:text-icon-brand-primary-pressed',
        'standalone-critical':
          'text-typography-status-critical-rest [&_svg]:text-icon-status-critical-rest hover:[&]:text-typography-status-critical-hover hover:[&_svg]:text-icon-status-critical-hover active:[&_svg]:text-icon-status-critical-pressed',
      },
      size: {
        large:
          'h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 py-2 [&_svg]:size-5',
        default:
          "h-8 gap-1 px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-control has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg]:size-3.5 [&_svg:not([class*='size-'])]:size-3.5",
        medium:
          "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-control has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg]:size-3.5 [&_svg:not([class*='size-'])]:size-3.5",
        small:
          "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg]:size-3 [&_svg:not([class*='size-'])]:size-3",
        'icon-xs':
          "size-6 rounded-control-sm [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:size-3",
        icon: 'size-7 grow-0 p-[6px] rounded-control [&_svg]:size-3.5',
        'icon-sm': 'size-8 rounded-control [&_svg]:size-3.5',
        'icon-lg': 'size-9 rounded-control [&_svg]:size-5',
        'no-padding':
          'p-0 h-6 bg-transparent hover:bg-transparent active:bg-transparent hover:opacity-80 active:opacity-60 [&_svg]:size-4',
      },
      activation: {
        none: 'none',
        trigger: '[&:active:not([aria-haspopup])]:translate-y-px',
      },
    },
    defaultVariants: {
      variant: 'filled',
      size: 'default',
      activation: 'none',
    },
    compoundVariants: [
      { variant: 'filled', colors: 'primary' },
      { variant: 'outline', colors: null },
    ],
  },
);

const ICON_ONLY_BUTTON_SIZES = new Set<
  NonNullable<VariantProps<typeof buttonVariants>['size']>
>(['icon-xs', 'icon', 'icon-sm', 'icon-lg']);

function isIconOnlyButtonSize(
  size: VariantProps<typeof buttonVariants>['size'],
): boolean {
  return size != null && ICON_ONLY_BUTTON_SIZES.has(size);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isChild?: boolean;
  as?: 'button' | 'span';
  iconPosition?: 'left' | 'right';
  icon?: React.ReactNode;
  iconClassName?: string;
  href?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
  title?: string;
}
function withIcon({
  iconPosition,
  content,
  icon,
  iconClassName,
}: {
  iconPosition: ButtonProps['iconPosition'];
  content: React.ReactNode;
  icon: React.ReactNode;
  iconClassName?: string;
}) {
  const iconClasses = classMerge(iconClassName);
  if (iconPosition === 'left') {
    return (
      <>
        <span className={iconClasses}>{icon}</span>
        {content}
      </>
    );
  }
  return (
    <>
      {content}
      <span className={iconClasses}>{icon}</span>
    </>
  );
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'filled',
      size = 'default',
      colors,
      isChild = false,
      as: asProp,
      icon,
      // A ordem no DOM define o lado do ícone (sem flex-row-reverse, que invertia de novo).
      iconPosition = 'left',
      iconClassName,
      children,
      href,
      isLoading = false,
      disabled,
      onClick,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const useSpan = asProp === 'span';
    // Polimórfico: Link quando há href, Slot com isChild, span ou button.
    const Comp: React.ElementType = href
      ? Link
      : isChild
        ? Slot
        : useSpan
          ? 'span'
          : 'button';
    const handleClick = (e: React.MouseEvent) => {
      if (isLoading || disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e as React.MouseEvent<HTMLButtonElement>);
    };
    let content = children;
    const finalIcon = isLoading ? (
      <Icon icon="loading" className="animate-spin" />
    ) : (
      icon
    );
    if (finalIcon) {
      content = withIcon({
        content: content,
        icon: finalIcon,
        iconPosition,
        iconClassName,
      });
    }
    const isDisabled = isLoading || disabled;

    const spanProps = useSpan
      ? {
          role: 'button' as const,
          tabIndex: isDisabled ? -1 : 0,
          'aria-disabled': isDisabled,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!isDisabled) {
                handleClick(e as unknown as React.MouseEvent);
              }
            }
          },
        }
      : {};

    return (
      <Comp
        className={classMerge(
          buttonVariants({
            colors,
            variant,
            size,
          }),
          isDisabled && 'cursor-not-allowed opacity-50',
          useSpan && !isDisabled && 'cursor-pointer',
          className,
        )}
        ref={ref}
        {...(href ? { href } : {})}
        onClick={handleClick}
        {...(useSpan ? spanProps : { disabled: isDisabled, type })}
        {...props}
      >
        {content}
      </Comp>
    );
  },
);
Button.displayName = 'Button';
export function SaveButton({
  onClick,
  size,
  children = 'Salvar',
  ...props
}: ButtonProps) {
  return (
    <Button
      onClick={onClick}
      colors="success"
      icon={<Icon icon="save" />}
      size={size}
      {...props}
    >
      {isIconOnlyButtonSize(size) ? null : children}
    </Button>
  );
}
export function DeleteButton({
  onClick,
  size,
  children = 'Excluir',
  ...props
}: ButtonProps) {
  return (
    <Button
      onClick={onClick}
      colors="critical"
      icon={<Icon icon="delete" />}
      size={size}
      {...props}
    >
      {isIconOnlyButtonSize(size) ? null : children}
    </Button>
  );
}
