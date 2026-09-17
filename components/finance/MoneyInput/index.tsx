'use client';

import { Input, type InputProps } from '@/components/ui/Input';
import { formatMoneyInput, parseMoneyInput } from '@/lib/money';
import { classMerge } from '@/lib/utils';
import * as React from 'react';

export type MoneyInputProps = Omit<
  InputProps,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'inputMode'
> & {
  /** Centavos (controlado). */
  value?: number | null;
  /** Centavos iniciais (não controlado). */
  defaultValue?: number | null;
  onValueChange?: (cents: number | null) => void;
  /** Permite valor negativo digitado com "-". */
  allowNegative?: boolean;
};

/**
 * Campo de valor em reais. Aceita "1.234,56", "1234,5", "R$ 12"; formata ao sair
 * do campo. Com `name`, envia centavos no formulário por um input escondido.
 */
export function MoneyInput({
  value,
  defaultValue = null,
  onValueChange,
  allowNegative = false,
  name,
  className,
  onBlur,
  ...props
}: MoneyInputProps) {
  const isControlled = value !== undefined;
  const [internalCents, setInternalCents] = React.useState<number | null>(defaultValue);
  const cents = isControlled ? value : internalCents;
  const [text, setText] = React.useState(() => (cents == null ? '' : formatMoneyInput(cents)));

  const commit = (next: number | null) => {
    if (!isControlled) {
      setInternalCents(next);
    }
    onValueChange?.(next);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextText = event.target.value;
    setText(nextText);
    const parsed = parseMoneyInput(nextText);
    commit(parsed != null && !allowNegative && parsed < 0 ? null : parsed);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setText(cents == null ? (parseMoneyInput(text) == null ? text : '') : formatMoneyInput(cents));
    onBlur?.(event);
  };

  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-typography-neutral-secondary"
      >
        R$
      </span>
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={props['aria-invalid'] ?? (text.trim() !== '' && cents == null ? true : undefined)}
        className={classMerge('pl-9 text-right tabular-nums', className)}
      />
      {name && <input type="hidden" name={name} value={cents ?? ''} />}
    </div>
  );
}
