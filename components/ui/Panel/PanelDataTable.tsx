'use client';

import { BootsPagination } from '@/components/ui/BootsPagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { classMerge } from '@/lib/utils';
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import * as React from 'react';
import { PanelEmptyState } from './PanelEmptyState';
import {
  PanelTable,
  PanelTableBody,
  PanelTableCell,
  PanelTableHead,
  PanelTableHeader,
  PanelTableRow,
} from './PanelTable';
import type {
  PanelDataTableColumn,
  PanelDataTableProps,
  PanelDataTableSort,
} from './types';

const VIRTUALIZATION_THRESHOLD = 60;

const severityScore: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

const pinnedHeadClasses = {
  left: 'sticky left-0 z-20 border-border-neutral-subtle border-r bg-background-surface-sunken',
  right:
    'sticky right-0 z-20 border-border-neutral-subtle border-l bg-background-surface-sunken',
} as const;

const pinnedCellClasses = {
  left: 'sticky left-0 z-[1] border-border-neutral-subtle border-r bg-background-neutral-000',
  right:
    'sticky right-0 z-[1] border-border-neutral-subtle border-l bg-background-neutral-000',
} as const;

function compareRows<T>(a: T, b: T, column: PanelDataTableColumn<T>): number {
  if (typeof column.sort === 'function') {
    return column.sort(a, b);
  }

  const left = column.sortValue?.(a);
  const right = column.sortValue?.(b);

  if (column.sort === 'severity') {
    const leftScore = severityScore[String(left).toLowerCase()] ?? -1;
    const rightScore = severityScore[String(right).toLowerCase()] ?? -1;
    return leftScore - rightScore;
  }

  if (typeof left === 'string' && typeof right === 'string') {
    return left.localeCompare(right);
  }

  return Number(left) - Number(right);
}

export function PanelDataTable<T>({
  data,
  columns,
  getRowKey,
  isLoading = false,
  isError = false,
  emptyMessage = 'No results found',
  emptyIcon = 'inbox',
  emptyDescription,
  errorMessage = 'Failed to load data',
  size,
  className,
  defaultSort,
  sort: sortProp,
  onSortChange,
  searchTerm,
  getSearchText,
  filter,
  pageSize,
  page: pageProp,
  onPageChange,
  totalCount,
  manual = false,
  stretch = false,
}: PanelDataTableProps<T>) {
  const [internalSort, setInternalSort] = React.useState<
    PanelDataTableSort | undefined
  >(defaultSort);
  const [internalPage, setInternalPage] = React.useState(0);

  const sort = sortProp !== undefined ? (sortProp ?? undefined) : internalSort;
  const page = pageProp !== undefined ? pageProp : internalPage;

  const setSort = (next: PanelDataTableSort | null) => {
    if (sortProp === undefined) {
      setInternalSort(next ?? undefined);
    }
    if (pageProp === undefined) {
      setInternalPage(0);
    }
    onSortChange?.(next);
  };

  const setPage = (next: number) => {
    if (pageProp === undefined) {
      setInternalPage(next);
    }
    onPageChange?.(next);
  };

  const toggleSort = (key: string) => {
    if (sort?.key !== key) {
      setSort({ key, dir: 'desc' });
    } else if (sort.dir === 'desc') {
      setSort({ key, dir: 'asc' });
    } else {
      setSort(null);
    }
  };

  const processed = React.useMemo(() => {
    let rows = data ?? [];

    if (manual) {
      return rows;
    }

    if (filter) {
      rows = rows.filter(filter);
    }

    if (searchTerm && getSearchText) {
      const term = searchTerm.toLowerCase();
      rows = rows.filter((row) =>
        getSearchText(row).toLowerCase().includes(term),
      );
    }

    if (sort) {
      const column = columns.find((candidate) => candidate.key === sort.key);
      if (column) {
        rows = [...rows].sort((a, b) => {
          const comparison = compareRows(a, b, column);
          return sort.dir === 'desc' ? -comparison : comparison;
        });
      }
    }

    return rows;
  }, [data, columns, filter, searchTerm, getSearchText, sort, manual]);

  const total = totalCount ?? processed.length;
  const pageCount = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, pageCount - 1);

  const visibleRows =
    pageSize && !manual
      ? processed.slice(safePage * pageSize, (safePage + 1) * pageSize)
      : processed;

  const isEmpty = !isLoading && !isError && visibleRows.length === 0;
  const skeletonRowCount = Math.min(pageSize ?? 4, 50);

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) {
      scroller.scrollTop = 0;
    }
  }, [page]);

  const shouldVirtualize =
    !isLoading && !isError && visibleRows.length > VIRTUALIZATION_THRESHOLD;

  const [scrollTarget, setScrollTarget] = React.useState<{
    mode: 'self' | 'ancestor' | 'window';
    element: HTMLElement | null;
    margin: number;
  }>({ mode: 'self', element: null, margin: 0 });

  React.useLayoutEffect(() => {
    if (!shouldVirtualize) {
      return;
    }
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const apply = (next: {
      mode: 'self' | 'ancestor' | 'window';
      element: HTMLElement | null;
      margin: number;
    }) => {
      setScrollTarget((prev) =>
        prev.mode === next.mode &&
        prev.element === next.element &&
        Math.abs(prev.margin - next.margin) < 1
          ? prev
          : next,
      );
    };

    const update = () => {
      if (scroller.scrollHeight > scroller.clientHeight + 1) {
        apply({ mode: 'self', element: scroller, margin: 0 });
        return;
      }

      let ancestor = scroller.parentElement;
      while (ancestor && ancestor !== document.body) {
        const style = window.getComputedStyle(ancestor);
        if (
          /(auto|scroll|overlay)/.test(style.overflowY) &&
          ancestor.scrollHeight > ancestor.clientHeight + 1
        ) {
          break;
        }
        ancestor = ancestor.parentElement;
      }

      if (ancestor && ancestor !== document.body) {
        apply({
          mode: 'ancestor',
          element: ancestor,
          margin:
            scroller.getBoundingClientRect().top -
            ancestor.getBoundingClientRect().top +
            ancestor.scrollTop,
        });
        return;
      }

      apply({
        mode: 'window',
        element: null,
        margin: scroller.getBoundingClientRect().top + window.scrollY,
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [shouldVirtualize, visibleRows.length]);

  const estimateSize = React.useCallback(
    () => (size === 'xs' ? 38 : 54),
    [size],
  );

  const elementVirtualizer = useVirtualizer({
    count: visibleRows.length,
    getScrollElement: () =>
      scrollTarget.mode === 'ancestor'
        ? scrollTarget.element
        : scrollerRef.current,
    estimateSize,
    overscan: 16,
    scrollMargin: scrollTarget.mode === 'ancestor' ? scrollTarget.margin : 0,
    enabled: shouldVirtualize && scrollTarget.mode !== 'window',
  });

  const windowVirtualizer = useWindowVirtualizer({
    count: visibleRows.length,
    estimateSize,
    overscan: 16,
    scrollMargin: scrollTarget.margin,
    enabled: shouldVirtualize && scrollTarget.mode === 'window',
  });

  const virtualizer =
    scrollTarget.mode === 'window' ? windowVirtualizer : elementVirtualizer;
  const virtualItems = virtualizer.getVirtualItems();
  const virtualScrollMargin = virtualizer.options.scrollMargin ?? 0;
  const paddingTop =
    virtualItems.length > 0 ? virtualItems[0].start - virtualScrollMargin : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? virtualizer.getTotalSize() -
        (virtualItems[virtualItems.length - 1].end - virtualScrollMargin)
      : 0;

  const renderRow = (row: T, index: number) => (
    <PanelTableRow
      key={getRowKey(row, index)}
      data-index={index}
      ref={shouldVirtualize ? virtualizer.measureElement : undefined}
    >
      {columns.map((column) => (
        <PanelTableCell
          key={column.key}
          className={classMerge(
            column.pinned && pinnedCellClasses[column.pinned],
            column.cellClassName,
          )}
        >
          {column.cell(row, index)}
        </PanelTableCell>
      ))}
    </PanelTableRow>
  );

  return (
    <>
      <PanelTable
        size={size}
        className={classMerge(
          !isLoading && !stretch && 'min-h-[20.5rem]',
          className,
        )}
        stretch={stretch || isEmpty || (!isLoading && isError)}
        fillTable={isEmpty || (!isLoading && isError)}
        scrollerRef={scrollerRef}
      >
        <PanelTableHeader>
          <tr>
            {columns.map((column) => {
              const sortable =
                column.sortable ??
                (column.sortValue !== undefined ||
                  typeof column.sort === 'function');
              return (
                <PanelTableHead
                  key={column.key}
                  data-pinned={column.pinned}
                  sortable={sortable}
                  sorted={sort?.key === column.key && sort.dir}
                  onClick={sortable ? () => toggleSort(column.key) : undefined}
                  className={classMerge(
                    column.pinned && pinnedHeadClasses[column.pinned],
                    column.headClassName,
                  )}
                  style={
                    column.minWidth ? { minWidth: column.minWidth } : undefined
                  }
                >
                  {column.header}
                </PanelTableHead>
              );
            })}
          </tr>
        </PanelTableHeader>
        <PanelTableBody>
          {isLoading &&
            Array.from({ length: skeletonRowCount }, (_, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <PanelTableCell key={column.key}>
                    <Skeleton className="h-[25px] w-20" />
                  </PanelTableCell>
                ))}
              </tr>
            ))}
          {!isLoading && isError && (
            <tr>
              <PanelTableCell colSpan={columns.length} className="p-0">
                <div className="sticky left-0 flex min-h-72 w-[var(--panel-table-client-w,100%)] flex-col items-center justify-center">
                  <PanelEmptyState icon="alert-circle" title={errorMessage} />
                </div>
              </PanelTableCell>
            </tr>
          )}
          {isEmpty && (
            <tr>
              <PanelTableCell colSpan={columns.length} className="p-0">
                <div className="sticky left-0 flex min-h-72 w-[var(--panel-table-client-w,100%)] flex-col items-center justify-center">
                  <PanelEmptyState
                    icon={emptyIcon}
                    title={emptyMessage}
                    description={emptyDescription}
                  />
                </div>
              </PanelTableCell>
            </tr>
          )}
          {!isLoading &&
            !isError &&
            (shouldVirtualize ? (
              <>
                {paddingTop > 0 && (
                  <tr aria-hidden data-panel-table-spacer="">
                    <td
                      colSpan={columns.length}
                      className="border-b-0! p-0"
                      style={{ height: paddingTop }}
                    />
                  </tr>
                )}
                {virtualItems.map((virtualItem) =>
                  renderRow(visibleRows[virtualItem.index], virtualItem.index),
                )}
                {paddingBottom > 0 && (
                  <tr aria-hidden data-panel-table-spacer="">
                    <td
                      colSpan={columns.length}
                      className="border-b-0! p-0"
                      style={{ height: paddingBottom }}
                    />
                  </tr>
                )}
              </>
            ) : (
              visibleRows.map((row, index) => renderRow(row, index))
            ))}
        </PanelTableBody>
      </PanelTable>
      {pageSize !== undefined && (
        <PanelTablePagination
          page={safePage}
          pageCount={pageCount}
          pageSize={pageSize}
          total={total}
          visibleCount={visibleRows.length}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
PanelDataTable.displayName = 'Panel.DataTable';

function PanelTablePagination({
  page,
  pageCount,
  pageSize,
  total,
  visibleCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  visibleCount: number;
  onPageChange: (page: number) => void;
}) {
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = page * pageSize + visibleCount;

  return (
    <div
      data-panel-body=""
      className="flex items-center justify-between gap-4 px-6 py-2 text-typography-neutral-secondary text-xs"
    >
      <span>
        {from}&ndash;{to} of {total}
      </span>
      <BootsPagination
        page={page + 1}
        count={pageCount}
        onChange={(nextPage) => onPageChange(nextPage - 1)}
        className="mx-0 w-auto justify-end"
      />
    </div>
  );
}
PanelTablePagination.displayName = 'Panel.TablePagination';
