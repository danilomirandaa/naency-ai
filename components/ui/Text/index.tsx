import { classMerge } from '@/lib/utils';
import { forwardRef } from 'react';

export type TextSize = keyof typeof textSizesClassNames;
export type TextColor = keyof typeof textColors;
export type TextWeight = keyof typeof textWeights;
export type TextVariant = keyof typeof textVariants;

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  size?: TextSize;
  color?: TextColor;
  weight?: TextWeight;
  element?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /**
   * Semantic variant that maps a typographic intent to a fixed combination of
   * size, weight, color and default HTML element.
   * Explicit `size`, `weight`, `color` and `element` props still override it.
   */
  variant?: TextVariant;
}

const textSizesClassNames = {
  inherit: 'text-inherit',
  base: 'text-base',
  '2xs': 'text-[10px] leading-3',
  xs: 'text-xs',
  sm: 'text-sm',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
};

type TextColors =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'error'
  | 'warning';
const textColors: Record<TextColors, string> = {
  primary: 'text-typography-neutral-primary',
  secondary: 'text-typography-neutral-secondary',
  accent: 'text-typography-brand-primary-rest',
  success: 'text-typography-status-success-rest',
  error: 'text-typography-status-critical-rest',
  warning: 'text-typography-status-warning-rest',
};

const textWeights = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

/**
 * Semantic variants – each maps a typographic intent to a fixed combination of
 * size, weight, color, and default HTML element.
 */
const textVariants = {
  'page-title': {
    size: '2xl' as TextSize, // 24px
    weight: 'semibold' as TextWeight,
    color: 'primary' as TextColor,
    element: 'h1' as TextProps['element'],
  },
  'section-title': {
    size: 'lg' as TextSize, // 18px
    weight: 'semibold' as TextWeight,
    color: 'primary' as TextColor,
    element: 'h2' as TextProps['element'],
  },
  subtitle: {
    size: 'base' as TextSize, // 16px
    weight: 'medium' as TextWeight,
    color: 'primary' as TextColor,
    element: 'h3' as TextProps['element'],
  },
  body: {
    size: 'sm' as TextSize, // 14px
    weight: 'normal' as TextWeight,
    color: 'primary' as TextColor,
    element: 'p' as TextProps['element'],
  },
  description: {
    size: 'xs' as TextSize, // 12px
    weight: 'normal' as TextWeight,
    color: 'secondary' as TextColor,
    element: 'p' as TextProps['element'],
  },
  label: {
    size: 'xs' as TextSize, // 12px
    weight: 'medium' as TextWeight,
    color: 'secondary' as TextColor,
    element: 'span' as TextProps['element'],
  },
  caption: {
    size: '2xs' as TextSize, // 10px
    weight: 'normal' as TextWeight,
    color: 'secondary' as TextColor,
    element: 'span' as TextProps['element'],
  },
} as const;

export const Text = forwardRef<HTMLElement, TextProps>(function TextComponent(
  {
    children,
    className = '',
    variant,
    size: sizeProp,
    color: colorProp,
    weight: weightProp,
    element: elementProp,
    ...rest
  },
  ref,
) {
  // Resolve variant defaults — explicit props always win
  const variantDefaults = variant ? textVariants[variant] : undefined;
  const size = sizeProp ?? variantDefaults?.size ?? 'inherit';
  const color = colorProp ?? variantDefaults?.color ?? 'primary';
  const weight = weightProp ?? variantDefaults?.weight ?? 'normal';
  const element = elementProp ?? variantDefaults?.element ?? 'span';

  // Elemento polimórfico: o tipo do ref varia com `element`.
  const Component = element as React.ElementType;

  return (
    <Component
      ref={ref}
      {...rest}
      className={classMerge(
        'font-inter',
        textSizesClassNames[size],
        textColors[color],
        textWeights[weight],
        className,
      )}
    >
      {children}
    </Component>
  );
});
