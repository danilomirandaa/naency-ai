'use client';

import { Text } from '@/components/ui/Text';
import { classMerge } from '@/lib/utils';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as React from 'react';

export type RadioGroupRootProps = React.ComponentProps<typeof RadioGroupPrimitive.Root>;

function RadioGroupRoot({ className, ...props }: RadioGroupRootProps) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={classMerge('grid gap-2', className)}
      {...props}
    />
  );
}
RadioGroupRoot.displayName = 'RadioGroup.Root';

export type RadioGroupCardProps = Omit<
  React.ComponentProps<typeof RadioGroupPrimitive.Item>,
  'children'
> & {
  label: React.ReactNode;
  description?: React.ReactNode;
};

/** Opção em formato de cartão: rótulo e descrição clicáveis. */
function RadioGroupCard({ className, label, description, id, ...props }: RadioGroupCardProps) {
  const generatedId = React.useId();
  const itemId = id ?? generatedId;
  const labelId = `${itemId}-label`;
  const descriptionId = description ? `${itemId}-description` : undefined;

  return (
    <label
      htmlFor={itemId}
      className={classMerge(
        'flex cursor-pointer items-start gap-3 rounded-control border border-border-neutral-rest bg-background-neutral-000 p-3 transition-colors',
        'hover:border-border-neutral-hover',
        'has-[[data-state=checked]]:border-background-brand-primary-rest has-[[data-state=checked]]:bg-background-neutral-100',
        'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60',
        className,
      )}
    >
      <RadioGroupPrimitive.Item
        id={itemId}
        // Nome só com o rótulo; a descrição entra como descrição acessível.
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        className={classMerge(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border-neutral-hover bg-background-neutral-000 outline-hidden',
          'focus-visible:ring-3 focus-visible:ring-ring/50',
          'data-[state=checked]:border-background-brand-primary-rest data-[state=checked]:bg-background-brand-primary-rest',
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="block size-1.5 rounded-full bg-typography-brand-on-primary" />
      </RadioGroupPrimitive.Item>
      <span className="flex min-w-0 flex-col gap-0.5">
        <Text id={labelId} size="sm" weight="medium">
          {label}
        </Text>
        {description && (
          <Text id={descriptionId} size="xs" color="secondary">
            {description}
          </Text>
        )}
      </span>
    </label>
  );
}
RadioGroupCard.displayName = 'RadioGroup.Card';

const RadioGroup = Object.assign(
  () => {
    throw new Error('RadioGroup is not a component. Render RadioGroup.Root instead.');
  },
  { Root: RadioGroupRoot, Card: RadioGroupCard },
);

export { RadioGroup, RadioGroupRoot, RadioGroupCard };
