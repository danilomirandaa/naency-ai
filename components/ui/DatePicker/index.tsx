'use client';

import { Calendar } from '@/components/ui/Calendar';
import { Icon } from '@/components/ui/Icon';
import { inputControlClassName } from '@/components/ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { formatIsoDate, isoDateToLocalDate, localDateToIsoDate } from '@/lib/dates';
import { classMerge } from '@/lib/utils';
import * as React from 'react';
import type { Matcher } from 'react-day-picker';

export type DatePickerProps = {
  /** "AAAA-MM-DD" (controlado). */
  value?: string | null;
  /** "AAAA-MM-DD" (não controlado). */
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Datas fora do intervalo ficam desabilitadas ("AAAA-MM-DD"). */
  min?: string;
  max?: string;
  /** Com `name`, envia "AAAA-MM-DD" no formulário por um input escondido. */
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
};

/** Anos para trás e para a frente no seletor quando não há min/max. */
const YEARS_RANGE = 20;

/**
 * Data de calendário (sem hora nem fuso) no padrão shadcn: botão com a data em
 * pt-BR ("16/09/2026") que abre o Calendar num Popover.
 */
export function DatePicker({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  name,
  placeholder = 'Escolha a data',
  disabled,
  className,
  ...triggerProps
}: DatePickerProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<string | null>(defaultValue);
  const selectedIso = isControlled ? value : internal;
  const [open, setOpen] = React.useState(false);

  const selected = selectedIso ? isoDateToLocalDate(selectedIso) : undefined;
  const minDate = min ? isoDateToLocalDate(min) : undefined;
  const maxDate = max ? isoDateToLocalDate(max) : undefined;
  const referenceYear = (selected ?? maxDate ?? minDate ?? new Date()).getFullYear();
  const disabledDays: Matcher[] = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  const handleSelect = (date: Date | undefined) => {
    const next = date ? localDateToIsoDate(date) : null;
    if (!isControlled) {
      setInternal(next);
    }
    onValueChange?.(next);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            data-slot="date-picker-trigger"
            data-placeholder={selectedIso ? undefined : ''}
            className={classMerge(
              inputControlClassName,
              'flex items-center gap-2 text-left tabular-nums data-[placeholder]:text-typography-neutral-secondary',
              className,
            )}
            {...triggerProps}
          >
            <Icon icon="calendar" className="size-4 text-icon-neutral-rest" />
            <span className="flex-1 truncate">
              {selectedIso ? formatIsoDate(selectedIso) : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? maxDate}
            onSelect={handleSelect}
            disabled={disabledDays}
            captionLayout="dropdown"
            startMonth={minDate ?? new Date(referenceYear - YEARS_RANGE, 0)}
            endMonth={maxDate ?? new Date(referenceYear + YEARS_RANGE, 11)}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {name && <input type="hidden" name={name} value={selectedIso ?? ''} />}
    </>
  );
}
