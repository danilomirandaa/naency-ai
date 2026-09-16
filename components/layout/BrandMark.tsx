import { Icon } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';

export type BrandMarkProps = {
  /** `full`: ícone + nome (sidebar). `icon`: só o ícone (telas de autenticação). */
  variant?: 'full' | 'icon';
  className?: string;
};

/** Logo e nome do Naency. */
export function BrandMark({ variant = 'full', className }: BrandMarkProps) {
  const icon = (
    <div
      className={classMerge(
        'flex aspect-square size-8 items-center justify-center rounded-control-sm bg-background-brand-primary-rest text-typography-brand-on-primary',
        variant === 'icon' && className,
      )}
    >
      <Icon icon="wallet" className="size-4" />
    </div>
  );

  if (variant === 'icon') {
    return icon;
  }

  return (
    <>
      {icon}
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">Naency</span>
        <span className="truncate text-typography-neutral-secondary text-xs">
          Controle financeiro
        </span>
      </div>
    </>
  );
}
