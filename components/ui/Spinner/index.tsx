import { Icon, type IconProps } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';

export type SpinnerProps = Omit<IconProps, 'icon'> & {
  /**
   * Nome anunciado por leitores de tela. `null` quando o contexto já diz o que
   * está carregando (ex.: botão "Salvando…").
   */
  label?: string | null;
};

/** Portado do shadcn/ui. Indicador de carregamento girando. */
export function Spinner({ className, label = 'Carregando', ...props }: SpinnerProps) {
  const a11y = label === null ? { 'aria-hidden': true } : { role: 'status', 'aria-label': label };
  return (
    <Icon
      icon="loading"
      data-slot="spinner"
      className={classMerge('size-4 animate-spin', className)}
      {...a11y}
      {...props}
    />
  );
}
