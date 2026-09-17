'use client';

import { MoneyCalculator } from '@/components/finance/MoneyCalculator';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input, type InputProps } from '@/components/ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { formatMoneyInput, maskMoneyInput, parseMoneyInput } from '@/lib/money';
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
  /** Permite valor negativo: "-" inverte o sinal. */
  allowNegative?: boolean;
  /** Botão com calculadora ao lado do campo. */
  calculator?: boolean;
};

function textFor(cents: number | null) {
  if (cents == null) {
    return '';
  }
  return cents < 0 ? `-${formatMoneyInput(-cents)}` : formatMoneyInput(cents);
}

/**
 * Campo de valor em reais formatado enquanto se digita ("123456" → "1.234,56").
 * Colar "R$ 1.234,56" ou "12,5" interpreta o valor inteiro. Com `name`, envia
 * centavos no formulário por um input escondido.
 */
export function MoneyInput({
  value,
  defaultValue = null,
  onValueChange,
  allowNegative = false,
  calculator = false,
  name,
  className,
  onPaste,
  ...props
}: MoneyInputProps) {
  const isControlled = value !== undefined;
  const [internalCents, setInternalCents] = React.useState<number | null>(defaultValue);
  const cents = isControlled ? value : internalCents;
  const [text, setText] = React.useState(() => textFor(cents));

  // Valor controlado mudado por fora (ex.: limpar o formulário) atualiza o texto.
  const [syncedCents, setSyncedCents] = React.useState(cents);
  if (cents !== syncedCents) {
    setSyncedCents(cents);
    if (maskMoneyInput(text, { allowNegative }).cents !== cents) {
      setText(textFor(cents));
    }
  }

  const apply = (next: { text: string; cents: number | null }) => {
    setText(next.text);
    setSyncedCents(next.cents);
    if (!isControlled) {
      setInternalCents(next.cents);
    }
    onValueChange?.(next.cents);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    apply(maskMoneyInput(event.target.value, { allowNegative }));
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(event);
    const pasted = parseMoneyInput(event.clipboardData.getData('text'));
    if (event.defaultPrevented || pasted == null || (!allowNegative && pasted < 0)) {
      return;
    }
    // Valor colado completo: substitui o campo em vez de passar pela máscara.
    event.preventDefault();
    apply({ text: textFor(pasted), cents: pasted });
  };

  const [calculatorOpen, setCalculatorOpen] = React.useState(false);

  const input = (
    <div className="relative min-w-0 flex-1">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-typography-neutral-secondary"
      >
        R$
      </span>
      <Input
        {...props}
        type="text"
        inputMode={allowNegative ? 'text' : 'numeric'}
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onPaste={handlePaste}
        className={classMerge('pl-9 text-right tabular-nums', calculator && 'rounded-r-none', className)}
      />
      {name && <input type="hidden" name={name} value={cents ?? ''} />}
    </div>
  );

  if (!calculator) {
    return input;
  }

  return (
    <div className="flex">
      {input}
      <Popover open={calculatorOpen} onOpenChange={setCalculatorOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Abrir calculadora"
            className="-ml-px shrink-0 rounded-l-none"
            disabled={props.disabled}
          >
            <Icon icon="calculator" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-auto p-2"
          // A calculadora foca a si mesma para receber o teclado.
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <MoneyCalculator
            initialCents={cents === null ? null : Math.abs(cents)}
            onApply={(value) => {
              const next = cents !== null && cents < 0 && allowNegative ? -value : value;
              apply({ text: textFor(next), cents: next });
              setCalculatorOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
