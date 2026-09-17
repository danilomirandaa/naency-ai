import { classMerge } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import type * as React from 'react';

/**
 * Portado do shadcn/ui (estilo radix-vega) com os tokens do Naency. Ao pressionar,
 * o botão desce 1px (`active:translate-y-px`), exceto quando abre menu ou popover.
 *
 * Ícones vão como filhos com `data-icon="inline-start"` ou `"inline-end"`, que
 * ajusta o espaçamento. Carregando: `disabled` + `<Spinner data-icon="inline-start" />`.
 */
export const buttonVariants = cva(
  [
    'group/button inline-flex shrink-0 items-center justify-center rounded-control border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-hidden select-none',
    'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
    'active:not-aria-[haspopup]:translate-y-px',
    'disabled:pointer-events-none disabled:opacity-50',
    'aria-invalid:border-border-status-critical-rest aria-invalid:ring-3 aria-invalid:ring-destructive/20',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4',
  ],
  {
    variants: {
      variant: {
        default:
          'bg-button-brand-primary-rest text-typography-brand-on-primary hover:bg-button-brand-primary-hover active:bg-button-brand-primary-pressed',
        outline:
          'border-border-neutral-rest bg-button-subtle-rest text-typography-neutral-primary shadow-xs hover:bg-button-subtle-hover active:bg-button-subtle-pressed aria-expanded:bg-button-subtle-hover [&_svg]:text-icon-neutral-rest',
        secondary:
          'bg-background-neutral-100 text-typography-neutral-primary hover:bg-background-neutral-200 aria-expanded:bg-background-neutral-200 [&_svg]:text-icon-neutral-rest',
        ghost:
          'text-typography-neutral-primary hover:bg-button-subtle-hover active:bg-button-subtle-pressed aria-expanded:bg-button-subtle-hover [&_svg]:text-icon-neutral-rest',
        destructive:
          'bg-background-status-critical-rest/10 text-typography-status-critical-rest hover:bg-background-status-critical-rest/20 focus-visible:border-border-status-critical-rest/40 focus-visible:ring-destructive/20 dark:bg-background-status-critical-rest/20 dark:hover:bg-background-status-critical-rest/30',
        link: 'text-typography-neutral-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: 'h-6 gap-1 rounded-control-sm px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg]:size-3',
        sm: 'h-8 gap-1 px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
        lg: 'h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-9',
        'icon-xs': 'size-6 rounded-control-sm [&_svg]:size-3',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Renderiza o filho (ex.: `<Link>`) com o visual de botão. */
    asChild?: boolean;
  };

export function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={classMerge(buttonVariants({ variant, size }), className)}
      // Fora de formulário por padrão; submit precisa ser explícito.
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  );
}
