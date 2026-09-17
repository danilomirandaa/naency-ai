'use client';

import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { CATEGORY_COLORS, CATEGORY_ICONS, type CategoryIconName } from '@/lib/categories';
import { readableTextColor } from '@/lib/color';
import { classMerge } from '@/lib/utils';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as React from 'react';

const ICON_LABELS: Record<CategoryIconName, string> = {
  'category-home': 'Casa',
  'category-market': 'Mercado',
  'category-food': 'Comida',
  'category-transport': 'Transporte',
  'category-fuel': 'Combustível',
  'category-health': 'Saúde',
  'category-education': 'Educação',
  'category-leisure': 'Lazer',
  'category-travel': 'Viagem',
  'category-subscriptions': 'Assinatura',
  'category-shopping': 'Compras',
  'category-clothes': 'Roupas',
  'category-pets': 'Pets',
  'category-gifts': 'Presentes',
  'category-bills': 'Contas',
  'category-energy': 'Energia',
  'category-water': 'Água',
  'category-internet': 'Internet',
  'category-phone': 'Celular',
  'category-fitness': 'Academia',
  'category-kids': 'Filhos',
  'category-salary': 'Salário',
  'category-investments': 'Investimentos',
  'category-refund': 'Reembolso',
  'category-business': 'Trabalho',
  'category-other': 'Outros',
};

export type CategoryStylePickerProps = {
  icon: CategoryIconName;
  color: string;
  onIconChange: (icon: CategoryIconName) => void;
  onColorChange: (color: string) => void;
  /** Nomes dos campos no formulário. */
  iconName?: string;
  colorName?: string;
};

const swatchClassName =
  'flex size-9 items-center justify-center rounded-control outline-hidden transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50';

/** Escolha de ícone e cor da categoria; o ícone aparece já na cor escolhida. */
export function CategoryStylePicker({
  icon,
  color,
  onIconChange,
  onColorChange,
  iconName = 'icon',
  colorName = 'color',
}: CategoryStylePickerProps) {
  const iconLabelId = React.useId();
  const colorLabelId = React.useId();
  const foreground = readableTextColor(color);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Text id={iconLabelId} size="xs" weight="medium">
          Ícone
        </Text>
        <RadioGroupPrimitive.Root
          aria-labelledby={iconLabelId}
          name={iconName}
          value={icon}
          onValueChange={(value) => onIconChange(value as CategoryIconName)}
          className="grid grid-cols-7 gap-1.5 sm:grid-cols-9"
        >
          {CATEGORY_ICONS.map((option) => (
            <RadioGroupPrimitive.Item
              key={option}
              value={option}
              aria-label={ICON_LABELS[option]}
              className={classMerge(
                swatchClassName,
                'border border-border-neutral-subtle text-icon-neutral-rest hover:bg-background-neutral-100',
                'data-[state=checked]:border-transparent',
              )}
              style={option === icon ? { backgroundColor: color, color: foreground } : undefined}
            >
              <Icon icon={option} className="size-4" />
            </RadioGroupPrimitive.Item>
          ))}
        </RadioGroupPrimitive.Root>
      </div>
      <div className="flex flex-col gap-1.5">
        <Text id={colorLabelId} size="xs" weight="medium">
          Cor
        </Text>
        <RadioGroupPrimitive.Root
          aria-labelledby={colorLabelId}
          name={colorName}
          value={color}
          onValueChange={onColorChange}
          className="flex flex-wrap gap-1.5"
        >
          {CATEGORY_COLORS.map((option, index) => (
            <RadioGroupPrimitive.Item
              key={option}
              value={option}
              aria-label={`Cor ${index + 1}`}
              className={classMerge(
                swatchClassName,
                'size-7 rounded-full ring-offset-2 ring-offset-background-neutral-000 data-[state=checked]:ring-2 data-[state=checked]:ring-border-neutral-hover',
              )}
              style={{ backgroundColor: option, color: readableTextColor(option) }}
            >
              <RadioGroupPrimitive.Indicator>
                <Icon icon="check" className="size-3.5" />
              </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
          ))}
        </RadioGroupPrimitive.Root>
      </div>
    </div>
  );
}
