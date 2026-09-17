'use client';

import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Icon } from '@/components/ui/Icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { isoDateToLocalDate, localDateToIsoDate, monthRange } from '@/lib/dates';
import {
  type DateRange,
  PERIOD_PRESET_LABELS,
  type PeriodPreset,
  detectPreset,
  formatRange,
  presetRange,
  shiftRangeByMonths,
  wholeMonthOf,
} from '@/lib/periods';
import { classMerge } from '@/lib/utils';
import * as React from 'react';
import type { DateRange as DayPickerRange } from 'react-day-picker';

export type PeriodPickerProps = {
  value: DateRange;
  onValueChange: (range: DateRange) => void;
  /** "AAAA-MM-DD" de hoje, para os atalhos. */
  today: string;
  className?: string;
};

const QUICK: PeriodPreset[] = ['today', 'yesterday'];
const PERIODS: PeriodPreset[] = ['this_week', 'last_week', 'this_month', 'last_month', 'this_year'];

/**
 * Período dos filtros: navegação por mês e por ano, atalhos (hoje, semana, mês,
 * ano) e intervalo personalizado no calendário.
 */
export function PeriodPicker({ value, onValueChange, today, className }: PeriodPickerProps) {
  const [rangeOpen, setRangeOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DayPickerRange | undefined>();
  const preset = detectPreset(value, today);
  const isMonth = wholeMonthOf(value) !== null;
  // "Filtrado" = qualquer coisa que não seja navegar de mês em mês.
  const filtered = !isMonth || (preset !== null && preset !== 'this_month' && preset !== 'last_month');
  const customRange = !isMonth && preset === null;

  const shift = (months: number) => onValueChange(shiftRangeByMonths(value, months));

  const presetItem = (item: PeriodPreset) => (
    <DropdownMenuItem key={item} onSelect={() => onValueChange(presetRange(item, today))}>
      <Icon icon={item === 'this_year' ? 'calendar-range' : 'calendar'} className="text-icon-neutral-rest" />
      {PERIOD_PRESET_LABELS[item]}
      {preset === item && <Icon icon="check" className="ml-auto text-icon-neutral-rest" />}
    </DropdownMenuItem>
  );

  return (
    <div role="group" aria-label="Período" className={classMerge('flex flex-wrap items-center gap-2', className)}>
      <div className="flex">
        <Button variant="outline" size="icon-sm" className="rounded-r-none" aria-label="Ano anterior" onClick={() => shift(-12)}>
          <Icon icon="chevron-left-pipe" />
        </Button>
        <Button variant="outline" size="icon-sm" className="-ml-px rounded-l-none" aria-label="Mês anterior" onClick={() => shift(-1)}>
          <Icon icon="chevron-left" />
        </Button>
      </div>
      <Button
        variant="outline"
        size="sm"
        aria-label={`Mês inteiro: ${formatRange(monthRange(value.from.slice(0, 7)))}`}
        onClick={() => onValueChange(monthRange(value.from.slice(0, 7)))}
      >
        <Icon icon="calendar" data-icon="inline-start" />
        <span aria-live="polite" className="tabular-nums">
          {formatRange(isMonth ? value : monthRange(value.from.slice(0, 7)))}
        </span>
      </Button>
      <div className="flex">
        <Button variant="outline" size="icon-sm" className="rounded-r-none" aria-label="Próximo mês" onClick={() => shift(1)}>
          <Icon icon="chevron-right" />
        </Button>
        <Button variant="outline" size="icon-sm" className="-ml-px rounded-l-none" aria-label="Próximo ano" onClick={() => shift(12)}>
          <Icon icon="chevron-right-pipe" />
        </Button>
      </div>

      <div className="flex">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={filtered ? 'default' : 'outline'} size="sm" className="rounded-r-none">
              <Icon icon="filter" data-icon="inline-start" />
              {filtered ? (preset ? PERIOD_PRESET_LABELS[preset] : formatRange(value)) : 'Filtre por'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs text-typography-neutral-secondary">Atalhos rápidos</DropdownMenuLabel>
            <DropdownMenuGroup>{QUICK.map(presetItem)}</DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-typography-neutral-secondary">Períodos</DropdownMenuLabel>
            <DropdownMenuGroup>{PERIODS.map(presetItem)}</DropdownMenuGroup>
            {filtered && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-typography-status-critical-rest"
                  onSelect={() => onValueChange(presetRange('this_month', today))}
                >
                  <Icon icon="close" />
                  Limpar filtro
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Popover
          open={rangeOpen}
          onOpenChange={(open) => {
            setRangeOpen(open);
            setDraft(undefined);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant={customRange ? 'default' : 'outline'}
              size="icon-sm"
              className="-ml-px rounded-l-none"
              aria-label="Escolher intervalo de datas"
            >
              <Icon icon="calendar-range" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" aria-label="Intervalo de datas" className="w-auto p-0">
            <Calendar
              mode="range"
              numberOfMonths={2}
              defaultMonth={isoDateToLocalDate(value.from)}
              selected={draft ?? { from: isoDateToLocalDate(value.from), to: isoDateToLocalDate(value.to) }}
              onSelect={(range, day) => {
                // Primeiro clique começa um intervalo novo; o segundo fecha.
                if (!draft) {
                  setDraft({ from: day, to: undefined });
                  return;
                }
                const from = range?.from ?? day;
                const to = range?.to ?? from;
                onValueChange({ from: localDateToIsoDate(from), to: localDateToIsoDate(to) });
                setDraft(undefined);
                setRangeOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
