import { readableTextColor } from '@/lib/color';
import { classMerge } from '@/lib/utils';

const STOPWORDS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

/** "Banco do Brasil" → "BB", "XP Investimentos" → "XP", "Nubank" → "N". */
export function institutionInitials(name: string) {
  const words = name.split(/[\s/]+/).filter((word) => word && !STOPWORDS.has(word.toLowerCase()));
  const [first, second] = words;
  if (!first) {
    return '?';
  }
  if (first.length <= 3 && first === first.toUpperCase()) {
    return first;
  }
  return `${first[0]}${second?.[0] ?? ''}`.toUpperCase();
}

const sizeClassName = {
  /** Cabe dentro de um `Badge` sem esticar a pílula. */
  xs: 'size-4 rounded-[4px] text-[7px]',
  sm: 'size-5 rounded-[5px] text-[8px]',
  md: 'size-8 rounded-control-sm text-[11px]',
} as const;

export type InstitutionLogoProps = {
  name: string;
  /** Cor da marca, "#rrggbb". */
  color: string;
  size?: keyof typeof sizeClassName;
  className?: string;
};

/**
 * Marca da instituição com iniciais sobre a cor dela. Sem logos de terceiros; o
 * texto usa preto ou branco, o que tiver mais contraste. Decorativo: o nome da
 * instituição aparece ao lado.
 */
export function InstitutionLogo({ name, color, size = 'md', className }: InstitutionLogoProps) {
  return (
    <span
      aria-hidden
      className={classMerge(
        'flex shrink-0 items-center justify-center font-semibold leading-none tracking-tight',
        sizeClassName[size],
        className,
      )}
      style={{ backgroundColor: color, color: readableTextColor(color) }}
    >
      {institutionInitials(name)}
    </span>
  );
}
