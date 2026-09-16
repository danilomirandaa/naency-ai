'use client';

import { Icon } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';
import * as React from 'react';
import type {
  PanelTableBodyProps,
  PanelTableCellProps,
  PanelTableHeadProps,
  PanelTableHeaderProps,
  PanelTableProps,
  PanelTableRowProps,
} from './types';

function assignRef<T>(ref: React.Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') {
    ref(node);
  } else if (ref) {
    ref.current = node;
  }
}

export function PanelTable({
  className,
  children,
  size = 'sm',
  stretch = false,
  fillTable = false,
  scrollerRef: scrollerRefProp,
  ...props
}: PanelTableProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const setScrollerRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      scrollerRef.current = node;
      assignRef(scrollerRefProp, node);
    },
    [scrollerRefProp],
  );

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    const scroller = scrollerRef.current;
    if (!wrapper || !scroller) {
      return;
    }

    const update = () => {
      const thead = scroller.querySelector('thead');
      if (thead) {
        wrapper.style.setProperty(
          '--panel-table-head-h',
          `${thead.getBoundingClientRect().height}px`,
        );
      }
      const start = Math.max(0, Math.round(scroller.scrollLeft));
      const end = Math.max(
        0,
        Math.round(
          scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft,
        ),
      );
      const endY = Math.max(
        0,
        Math.round(
          scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop,
        ),
      );
      const pinnedWidth = (side: 'left' | 'right') =>
        Array.from(
          scroller.querySelectorAll<HTMLElement>(
            `thead th[data-pinned="${side}"]`,
          ),
        ).reduce((total, cell) => total + cell.getBoundingClientRect().width, 0);
      wrapper.style.setProperty(
        '--panel-table-pinned-left',
        `${Math.round(pinnedWidth('left'))}px`,
      );
      wrapper.style.setProperty(
        '--panel-table-pinned-right',
        `${Math.round(pinnedWidth('right'))}px`,
      );
      wrapper.style.setProperty('--panel-table-overflow-start', `${start}px`);
      wrapper.style.setProperty('--panel-table-overflow-end', `${end}px`);
      wrapper.style.setProperty('--panel-table-overflow-y-end', `${endY}px`);
      wrapper.style.setProperty(
        '--panel-table-client-w',
        `${scroller.clientWidth}px`,
      );
      wrapper.style.setProperty(
        '--panel-table-gutter-x',
        `${scroller.offsetWidth - scroller.clientWidth}px`,
      );
      wrapper.style.setProperty(
        '--panel-table-gutter-y',
        `${scroller.offsetHeight - scroller.clientHeight}px`,
      );
    };

    update();
    document.fonts?.ready.then(update);
    scroller.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    const table = scroller.querySelector('table');
    if (table) {
      observer.observe(table);
    }
    return () => {
      scroller.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      data-panel-body=""
      data-panel-table=""
      className={classMerge(
        'group/table relative isolate mx-0.5 flex flex-col [--panel-table-head-h:2.5rem] [--panel-table-mask-w:3.75rem]',
        size === 'xs'
          ? '[--panel-table-cell-py:0.375rem]'
          : '[--panel-table-cell-py:1rem]',
        stretch && 'min-h-0 flex-1',
        className,
      )}
      {...props}
    >
      <div className="-z-10 pointer-events-none absolute inset-0 top-[var(--panel-table-head-h)] rounded-[14px] bg-background-neutral-000" />
      <div className="pointer-events-none absolute inset-0 top-[var(--panel-table-head-h)] z-10 rounded-[14px] ring-2 ring-background-surface-sunken" />
      <div className="pointer-events-none absolute inset-0 top-[var(--panel-table-head-h)] z-20 rounded-[14px] shadow-panel-body ring-1 ring-[rgba(25,28,33,0.04)] dark:shadow-panel-body-dark dark:ring-black/20" />
      <div className="pointer-events-none absolute top-[var(--panel-table-head-h)] left-0 z-[15] size-[14px] bg-[radial-gradient(circle_at_100%_100%,transparent_13.5px,var(--background-surface-sunken)_14px)]" />
      <div className="pointer-events-none absolute top-[var(--panel-table-head-h)] right-0 z-[15] size-[14px] bg-[radial-gradient(circle_at_0_100%,transparent_13.5px,var(--background-surface-sunken)_14px)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 z-[15] size-[14px] bg-[radial-gradient(circle_at_100%_0,transparent_13.5px,var(--background-surface-sunken)_14px)]" />
      <div className="pointer-events-none absolute right-0 bottom-0 z-[15] size-[14px] bg-[radial-gradient(circle_at_0_0,transparent_13.5px,var(--background-surface-sunken)_14px)]" />
      <div
        ref={setScrollerRef}
        className={classMerge(
          'min-h-0 overflow-auto rounded-[14px]',
          '[&::-webkit-scrollbar-corner]:bg-transparent [&::-webkit-scrollbar-track:vertical]:mt-[var(--panel-table-head-h)] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:size-2.5 [&::-webkit-scrollbar]:bg-transparent',
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding',
          '[&::-webkit-scrollbar-thumb:hover]:bg-icon-neutral-rest group-hover/table:[&::-webkit-scrollbar-thumb]:bg-border-neutral-hover',
          'flex-1',
        )}
      >
        <table
          className={classMerge(
            'w-full border-separate border-spacing-0 whitespace-nowrap [&_.text-balance]:text-nowrap [&_.text-wrap]:text-nowrap [&_td_.flex-wrap]:flex-nowrap',
            size === 'xs' ? 'text-xs' : 'text-sm',
            fillTable && 'h-full',
          )}
        >
          {children}
        </table>
      </div>
      <div className="pointer-events-none absolute top-0 left-[var(--panel-table-pinned-left,0px)] z-10 h-[var(--panel-table-head-h)] w-[min(var(--panel-table-mask-w),var(--panel-table-overflow-start,0px))] bg-linear-to-r from-background-surface-sunken to-transparent" />
      <div className="pointer-events-none absolute top-[var(--panel-table-head-h)] bottom-[var(--panel-table-gutter-y,0px)] left-[var(--panel-table-pinned-left,0px)] z-10 w-[min(var(--panel-table-mask-w),var(--panel-table-overflow-start,0px))] rounded-l-[14px] bg-linear-to-r from-background-neutral-000 to-transparent" />
      <div className="pointer-events-none absolute top-0 right-[calc(var(--panel-table-gutter-x,0px)+var(--panel-table-pinned-right,0px))] z-10 h-[var(--panel-table-head-h)] w-[min(var(--panel-table-mask-w),var(--panel-table-overflow-end,0px))] bg-linear-to-l from-background-surface-sunken to-transparent" />
      <div className="pointer-events-none absolute top-[var(--panel-table-head-h)] right-[calc(var(--panel-table-gutter-x,0px)+var(--panel-table-pinned-right,0px))] bottom-[var(--panel-table-gutter-y,0px)] z-10 w-[min(var(--panel-table-mask-w),var(--panel-table-overflow-end,0px))] rounded-r-[14px] bg-linear-to-l from-background-neutral-000 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[var(--panel-table-gutter-y,0px)] z-10 h-[min(var(--panel-table-mask-w),var(--panel-table-overflow-y-end,0px))] rounded-b-[14px] bg-linear-to-t from-background-neutral-000 to-transparent" />
    </div>
  );
}
PanelTable.displayName = 'Panel.Table';

export function PanelTableHeader({
  className,
  ...props
}: PanelTableHeaderProps) {
  return (
    <thead
      className={classMerge(
        'sticky top-0 z-10 bg-background-surface-sunken [&_.text-balance]:text-nowrap',
        className,
      )}
      {...props}
    />
  );
}
PanelTableHeader.displayName = 'Panel.TableHeader';

export function PanelTableHead({
  className,
  sortable = false,
  sorted,
  children,
  ...props
}: PanelTableHeadProps) {
  return (
    <th
      aria-sort={
        sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined
      }
      className={classMerge(
        'h-[var(--panel-table-head-h)] px-5 text-left align-middle font-medium text-typography-neutral-secondary text-xs',
        sortable &&
          'group/table-head cursor-pointer transition-colors hover:text-typography-neutral-primary',
        sorted && 'text-typography-neutral-primary',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <Icon
            icon="chevron-down"
            className={classMerge(
              'size-4 opacity-0 transition group-hover/table-head:opacity-100',
              sorted && 'opacity-100',
              sorted === 'asc' && 'rotate-180',
            )}
          />
        )}
      </div>
    </th>
  );
}
PanelTableHead.displayName = 'Panel.TableHead';

export function PanelTableBody({ className, ...props }: PanelTableBodyProps) {
  return (
    <tbody
      className={classMerge(
        '[&>tr:first-child>td:first-child]:rounded-tl-xl [&>tr:first-child>td:last-child]:rounded-tr-xl [&>tr:last-child>td:first-child]:rounded-bl-xl [&>tr:last-child>td:last-child]:rounded-br-xl [&>tr:last-child>td]:border-b-0 [&>tr>td]:border-border-neutral-subtle [&>tr>td]:border-b',
        className,
      )}
      {...props}
    />
  );
}
PanelTableBody.displayName = 'Panel.TableBody';

export function PanelTableRow({ className, ...props }: PanelTableRowProps) {
  return (
    <tr
      className={classMerge(
        'group/table-row [&:hover>td]:bg-background-surface-sunken dark:[&:hover>td]:bg-background-neutral-100 [&>td]:transition-colors',
        className,
      )}
      {...props}
    />
  );
}
PanelTableRow.displayName = 'Panel.TableRow';

export function PanelTableCell({ className, ...props }: PanelTableCellProps) {
  return (
    <td
      className={classMerge(
        'px-5 py-[var(--panel-table-cell-py,1rem)] align-middle text-typography-neutral-primary',
        className,
      )}
      {...props}
    />
  );
}
PanelTableCell.displayName = 'Panel.TableCell';
