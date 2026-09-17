'use client';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { formatMonth, shiftMonth } from '@/lib/dates';
import { classMerge } from '@/lib/utils';

export type MonthPickerProps = {
  /** "AAAA-MM" */
  value: string;
  onValueChange: (month: string) => void;
  className?: string;
};

/** Navegação de mês: ‹ Setembro de 2026 ›. */
export function MonthPicker({ value, onValueChange, className }: MonthPickerProps) {
  return (
    <div
      role="group"
      aria-label="Período"
      className={classMerge('flex items-center gap-1', className)}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Mês anterior"
        onClick={() => onValueChange(shiftMonth(value, -1))}
      >
        <Icon icon="chevron-left" />
      </Button>
      <span aria-live="polite" className="min-w-36 text-center text-sm font-medium tabular-nums">
        {formatMonth(value)}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Próximo mês"
        onClick={() => onValueChange(shiftMonth(value, 1))}
      >
        <Icon icon="chevron-right" />
      </Button>
    </div>
  );
}
