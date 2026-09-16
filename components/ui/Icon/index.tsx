import { type Icons, icons } from '@/components/ui/Icon/icons';
import { classMerge } from '@/lib/utils';
import type { IconProps as DevignerIconProps } from '@devigner-ui/icons';

export type { Icons };

export type IconProps = Omit<DevignerIconProps, 'ref'> & {
  icon: Icons;
};

/**
 * Decorativo por padrão (`aria-hidden`). Com `aria-label`, vira imagem
 * acessível. `variant`: Outline (padrão), TwoTone, Bold ou Bulk.
 */
export function Icon({ icon, className, ...props }: IconProps) {
  const IconComponent = icons[icon];

  return (
    <IconComponent className={classMerge('size-6 shrink-0', className)} {...props} />
  );
}
