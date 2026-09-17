'use client';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { type CalculatorKey, evaluateExpression, pressKey } from '@/lib/calculator';
import { classMerge } from '@/lib/utils';
import * as React from 'react';

export type MoneyCalculatorProps = {
  /** Valor inicial em centavos (o que está no campo). */
  initialCents: number | null;
  /** Aplica o resultado (centavos) no campo. */
  onApply: (cents: number) => void;
};

const KEYS: { key: CalculatorKey; label?: React.ReactNode; aria: string; wide?: boolean; tone?: 'op' | 'primary' }[] = [
  { key: 'C', aria: 'Limpar', wide: true, tone: 'op' },
  { key: '⌫', label: <Icon icon="backspace" />, aria: 'Apagar', tone: 'op' },
  { key: '÷', aria: 'Dividir', tone: 'op' },
  { key: '7', aria: '7' },
  { key: '8', aria: '8' },
  { key: '9', aria: '9' },
  { key: '×', aria: 'Multiplicar', tone: 'op' },
  { key: '4', aria: '4' },
  { key: '5', aria: '5' },
  { key: '6', aria: '6' },
  { key: '-', aria: 'Subtrair', tone: 'op' },
  { key: '1', aria: '1' },
  { key: '2', aria: '2' },
  { key: '3', aria: '3' },
  { key: '+', aria: 'Somar', tone: 'op' },
  { key: '0', aria: '0', wide: true },
  { key: '.', aria: 'Vírgula' },
  { key: '=', aria: 'Igual', tone: 'primary' },
];

function keyFromEvent(event: React.KeyboardEvent): CalculatorKey | null {
  const map: Record<string, CalculatorKey> = {
    '*': '×',
    x: '×',
    '/': '÷',
    ',': '.',
    Enter: '=',
    '=': '=',
    Backspace: '⌫',
    Delete: 'C',
    c: 'C',
  };
  if (/^\d$/.test(event.key)) {
    return event.key as CalculatorKey;
  }
  if (['+', '-', '.'].includes(event.key)) {
    return event.key as CalculatorKey;
  }
  return map[event.key] ?? null;
}

/** Calculadora para o campo de valor: faz a conta e aplica o resultado. */
export function MoneyCalculator({ initialCents, onApply }: MoneyCalculatorProps) {
  const [expression, setExpression] = React.useState(
    initialCents ? String(Math.round(initialCents) / 100) : '',
  );
  const result = evaluateExpression(expression);
  const groupRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    groupRef.current?.focus();
  }, []);
  const canApply = result !== null && result > 0;

  const apply = () => {
    if (canApply) {
      onApply(Math.round(result * 100));
    }
  };

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label="Calculadora"
      // Foco no grupo para digitar direto pelo teclado.
      tabIndex={-1}
      className="flex w-60 flex-col gap-2 outline-hidden"
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          event.preventDefault();
          apply();
          return;
        }
        const key = keyFromEvent(event);
        if (key) {
          event.preventDefault();
          setExpression((current) => pressKey(current, key));
        }
      }}
    >
      <output
        aria-live="polite"
        aria-label="Conta"
        className="flex h-12 items-center justify-end overflow-hidden rounded-control bg-background-neutral-100 px-3 text-right text-xl font-semibold tabular-nums"
      >
        <span className="truncate">{expression.replace(/\./g, ',') || '0'}</span>
      </output>
      <Button onClick={apply} disabled={!canApply} className="justify-between">
        <span className="flex items-center gap-1.5">
          <Icon icon="copy" />
          Copiar
        </span>
        <kbd className="rounded-control-sm border border-current/20 px-1.5 text-xs font-normal opacity-80">⌘ + ↵</kbd>
      </Button>
      <div className="grid grid-cols-4 gap-1.5">
        {KEYS.map((item) => (
          <Button
            key={item.key}
            variant={item.tone === 'primary' ? 'default' : item.tone === 'op' ? 'secondary' : 'outline'}
            size="sm"
            aria-label={item.aria}
            className={classMerge('h-9 text-base tabular-nums', item.wide && 'col-span-2')}
            onClick={() => setExpression((current) => pressKey(current, item.key))}
          >
            {item.label ?? item.key.replace('.', ',')}
          </Button>
        ))}
      </div>
    </div>
  );
}
