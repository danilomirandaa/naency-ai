import { classMerge } from '@/lib/utils';
import type * as React from 'react';

export type BadgeVariant = 'solid' | 'outline' | 'neutral';
export type BadgeTone = 'critical' | 'success' | 'neutral';

/**
 * O peso visual acompanha a urgência: `solid` salta da linha, `outline` chama
 * sem gritar e `neutral` informa sem disputar atenção. Por isso o tom só muda
 * de verdade em `solid` e `outline` — o neutro é sempre cinza.
 */
const VARIANTS: Record<BadgeVariant, Record<BadgeTone, string>> = {
  solid: {
    // O vermelho sólido é o `-strong`: o `-rest` não tem contraste para texto branco.
    critical: 'bg-background-status-critical-strong text-typography-neutral-on-color',
    success: 'bg-background-status-success-strong text-typography-neutral-on-color',
    neutral: 'bg-background-neutral-inverse text-typography-neutral-inverse',
  },
  outline: {
    critical:
      'bg-background-status-critical-rest/8 text-typography-status-critical-rest ring-1 ring-border-status-critical-rest ring-inset',
    // Não há token de borda para sucesso: o próprio fundo com alpha faz o contorno.
    success:
      'bg-background-status-success-rest/8 text-typography-status-success-rest ring-1 ring-background-status-success-rest/40 ring-inset',
    neutral: 'text-typography-neutral-secondary ring-1 ring-border-neutral-rest ring-inset',
  },
  neutral: {
    critical: 'bg-background-neutral-100 text-typography-neutral-secondary ring-1 ring-border-neutral-subtle ring-inset',
    success: 'bg-background-neutral-100 text-typography-neutral-secondary ring-1 ring-border-neutral-subtle ring-inset',
    neutral: 'bg-background-neutral-100 text-typography-neutral-secondary ring-1 ring-border-neutral-subtle ring-inset',
  },
};

export type BadgeProps = React.ComponentProps<'span'> & {
  variant?: BadgeVariant;
  tone?: BadgeTone;
};

/**
 * Pílula de rótulo: situação, forma de pagamento, categoria, conta. Aceita um
 * ícone como filho, antes do texto.
 *
 * Não confundir com `Panel.RowBadge`, que é o selo pequeno e quadrado das linhas
 * de lista (ex.: "Possível duplicado" na importação). Em tabela, use este.
 */
export function Badge({ variant = 'neutral', tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={classMerge(
        'inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 font-medium text-[11px] leading-4 [&_svg]:size-3 [&_svg]:shrink-0',
        VARIANTS[variant][tone],
        className,
      )}
      {...props}
    />
  );
}
Badge.displayName = 'Badge';
