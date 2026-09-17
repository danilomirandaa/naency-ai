'use client';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';
import * as React from 'react';
import { type DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Portado do shadcn/ui (new-york-v4) com os tokens do Naency. Em pt-BR por
 * padrão: nomes de mês e dia da semana em português e semana começando no domingo.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  locale = ptBR,
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      className={classMerge(
        'group/calendar bg-background-neutral-000 p-3 [--cell-size:--spacing(8)] [[data-slot=popover-content]_&]:bg-transparent',
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
        ...formatters,
      }}
      classNames={{
        root: classMerge('w-fit', defaults.root),
        months: classMerge('relative flex flex-col gap-4 md:flex-row', defaults.months),
        month: classMerge('flex w-full flex-col gap-4', defaults.month),
        nav: classMerge(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          defaults.nav,
        ),
        button_previous: classMerge(
          'inline-flex size-(--cell-size) items-center justify-center rounded-control p-0 text-icon-neutral-rest select-none hover:bg-background-neutral-100 aria-disabled:opacity-50',
          defaults.button_previous,
        ),
        button_next: classMerge(
          'inline-flex size-(--cell-size) items-center justify-center rounded-control p-0 text-icon-neutral-rest select-none hover:bg-background-neutral-100 aria-disabled:opacity-50',
          defaults.button_next,
        ),
        month_caption: classMerge(
          'flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)',
          defaults.month_caption,
        ),
        dropdowns: classMerge(
          'flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium',
          defaults.dropdowns,
        ),
        dropdown_root: classMerge(
          'relative rounded-control border border-border-neutral-rest shadow-input has-focus:border-border-neutral-hover has-focus:ring-3 has-focus:ring-ring/40',
          defaults.dropdown_root,
        ),
        dropdown: classMerge('absolute inset-0 bg-background-neutral-000 opacity-0', defaults.dropdown),
        caption_label: classMerge(
          'font-medium select-none',
          captionLayout === 'label'
            ? 'text-sm capitalize'
            : 'flex h-8 items-center gap-1 rounded-control pr-1 pl-2 text-sm capitalize [&>svg]:size-3.5 [&>svg]:text-icon-neutral-rest',
          defaults.caption_label,
        ),
        month_grid: classMerge('w-full border-collapse', defaults.month_grid),
        weekdays: classMerge('flex', defaults.weekdays),
        weekday: classMerge(
          'flex-1 rounded-control text-[0.8rem] font-normal text-typography-neutral-secondary select-none',
          defaults.weekday,
        ),
        week: classMerge('mt-2 flex w-full', defaults.week),
        day: classMerge(
          'group/day relative aspect-square h-full w-full p-0 text-center select-none',
          defaults.day,
        ),
        today: classMerge('rounded-control bg-background-neutral-100', defaults.today),
        outside: classMerge(
          '[&_button]:text-typography-neutral-secondary [&_button[data-selected-single=true]]:text-typography-brand-on-primary',
          defaults.outside,
        ),
        disabled: classMerge('text-typography-neutral-tertiary opacity-50', defaults.disabled),
        hidden: classMerge('invisible', defaults.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div data-slot="calendar" ref={rootRef} className={rootClassName} {...rootProps} />
        ),
        Chevron: ({ className: chevronClassName, orientation }) => (
          <Icon
            icon={
              orientation === 'left'
                ? 'chevron-left'
                : orientation === 'right'
                  ? 'chevron-right'
                  : 'chevron-down'
            }
            className={classMerge('size-4', chevronClassName)}
          />
        ),
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaults = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus();
    }
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="standalone"
      size="no-padding"
      data-day={day.isoDate}
      data-selected-single={modifiers.selected}
      className={classMerge(
        'flex aspect-square h-auto w-full min-w-(--cell-size) rounded-control font-normal tabular-nums leading-none',
        'bg-transparent hover:bg-background-neutral-100 hover:opacity-100 active:opacity-100',
        'group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-3 group-data-[focused=true]/day:ring-ring/40',
        'data-[selected-single=true]:bg-button-brand-primary-rest data-[selected-single=true]:text-typography-brand-on-primary data-[selected-single=true]:hover:bg-button-brand-primary-hover',
        defaults.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
