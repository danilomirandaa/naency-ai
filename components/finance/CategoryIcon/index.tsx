import { Icon } from '@/components/ui/Icon';
import type { CategoryIconName } from '@/lib/categories';
import { readableTextColor } from '@/lib/color';
import { classMerge } from '@/lib/utils';

const sizeClassName = {
  sm: 'size-5 rounded-[5px] [&_svg]:size-3',
  md: 'size-8 rounded-control-sm [&_svg]:size-4',
} as const;

export type CategoryIconProps = {
  icon: CategoryIconName;
  /** Cor da categoria, "#rrggbb". */
  color: string;
  size?: keyof typeof sizeClassName;
  className?: string;
};

/** Ícone da categoria sobre a cor dela. Decorativo: o nome aparece ao lado. */
export function CategoryIcon({ icon, color, size = 'md', className }: CategoryIconProps) {
  return (
    <span
      aria-hidden
      data-slot="category-icon"
      className={classMerge('flex shrink-0 items-center justify-center', sizeClassName[size], className)}
      style={{ backgroundColor: color, color: readableTextColor(color) }}
    >
      <Icon icon={icon} />
    </span>
  );
}
