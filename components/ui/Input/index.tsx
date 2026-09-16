'use client';

import { Text } from '@/components/ui/Text';
import { classMerge } from '@/lib/utils';
import * as React from 'react';

export type InputProps = React.ComponentProps<'input'>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      data-slot="input"
      className={classMerge(
        'h-9 w-full min-w-0 rounded-control border border-border-neutral-rest bg-background-neutral-000 px-3 text-sm text-typography-neutral-primary shadow-input outline-hidden transition-[color,box-shadow,border-color]',
        'placeholder:text-typography-neutral-tertiary hover:border-border-neutral-hover',
        'focus-visible:border-border-neutral-hover focus-visible:ring-3 focus-visible:ring-ring/40',
        'aria-invalid:border-border-status-critical-rest aria-invalid:focus-visible:ring-destructive/30',
        'disabled:cursor-not-allowed disabled:bg-background-neutral-disabled disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}
Input.displayName = 'Input';

export type FieldControlProps = {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
};

export type FieldProps = {
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  /** Recebe id e atributos de acessibilidade para espalhar no controle. */
  children: (control: FieldControlProps) => React.ReactNode;
};

/**
 * Rótulo, descrição e erro ligados ao controle por id e aria-describedby, para
 * leitores de tela anunciarem tudo junto.
 */
export function Field({ label, description, error, className, children }: FieldProps) {
  const id = React.useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div data-slot="field" className={classMerge('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="w-fit">
        <Text size="xs" weight="medium">
          {label}
        </Text>
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        ...(error ? { 'aria-invalid': true as const } : {}),
      })}
      {description && (
        <Text id={descriptionId} size="xs" color="secondary" element="p">
          {description}
        </Text>
      )}
      {error && (
        <Text id={errorId} size="xs" color="error" element="p">
          {error}
        </Text>
      )}
    </div>
  );
}
Field.displayName = 'Field';
