import { Icon } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';
import type * as React from 'react';

export type NativeSelectProps = React.ComponentProps<'select'>;

/**
 * `<select>` nativo com o visual do Input. Acessível e com a lista do sistema no
 * celular; use quando não precisar de busca nem de conteúdo rico nas opções.
 */
export function NativeSelect({ className, children, ...props }: NativeSelectProps) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={classMerge(
          'h-9 w-full min-w-0 appearance-none rounded-control border border-border-neutral-rest bg-background-neutral-000 pr-9 pl-3 text-sm text-typography-neutral-primary shadow-input outline-hidden transition-[color,box-shadow,border-color]',
          'hover:border-border-neutral-hover focus-visible:border-border-neutral-hover focus-visible:ring-3 focus-visible:ring-ring/40',
          'aria-invalid:border-border-status-critical-rest aria-invalid:focus-visible:ring-destructive/30',
          'disabled:cursor-not-allowed disabled:bg-background-neutral-disabled disabled:opacity-60',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <Icon
        icon="chevron-down"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-icon-neutral-rest"
      />
    </div>
  );
}
NativeSelect.displayName = 'NativeSelect';
