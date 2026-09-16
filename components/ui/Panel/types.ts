import type { Icons } from '@/components/ui/Icon/icons';
import type { Switch } from '@/components/ui/Switch';
import type { Text } from '@/components/ui/Text';
import type * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import type { motion } from 'motion/react';
import type * as React from 'react';

type DivProps = React.ComponentPropsWithRef<'div'>;

export type PanelRootProps = DivProps;

export type PanelMainProps = DivProps;

export type PanelGridProps = DivProps;

export type PanelBodyProps = DivProps;

export type PanelHeaderProps = DivProps;

export type PanelTitleProps = React.ComponentProps<typeof Text>;

export type PanelDescriptionProps = React.ComponentProps<typeof Text>;

export type PanelHeaderTextProps = DivProps;

export type PanelHeaderActionProps = DivProps;

export type PanelInfoTipProps = {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
};

export type PanelContentProps = DivProps;

export type PanelFooterProps = DivProps;

export type PanelFooterStartProps = DivProps;

export type PanelFooterEndProps = DivProps;

export type PanelFooterLinkProps = React.ComponentPropsWithRef<'a'>;

export type PanelGroupProps = DivProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
};

export type PanelGroupContentProps = React.ComponentPropsWithRef<
  typeof CollapsiblePrimitive.Content
>;

export type PanelRowProps = DivProps & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  bindGroup?: boolean;
};

export type PanelRowHeaderProps = DivProps;

export type PanelRowSwitchProps = Omit<
  React.ComponentProps<typeof Switch>,
  'checked' | 'defaultChecked' | 'onCheckedChange' | 'disabled'
>;

export type PanelRowIconProps = DivProps & {
  icon: Icons;
  iconClassName?: string;
};

export type PanelRowTextProps = DivProps;

export type PanelRowTitleProps = React.ComponentProps<typeof Text>;

export type PanelRowDescriptionProps = React.ComponentProps<typeof Text>;

export type PanelRowBadgeProps = React.ComponentPropsWithRef<'span'> & {
  color?: 'blue' | 'green' | 'gray' | 'dark' | 'yellow' | 'red';
};

export type PanelLinkProps = React.ComponentPropsWithRef<'a'>;

export type PanelLabelRowProps = DivProps;

export type PanelEmptyStateProps = Omit<DivProps, 'title'> & {
  icon?: Icons;
  title: React.ReactNode;
  description?: React.ReactNode;
};

export type PanelQueryStateProps = Omit<DivProps, 'children'> & {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  skeleton?: React.ReactNode;
  errorIcon?: Icons;
  errorMessage?: React.ReactNode;
  errorDescription?: React.ReactNode;
  errorAction?: React.ReactNode;
  emptyIcon?: Icons;
  emptyMessage?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  emptyAction?: React.ReactNode;
  children: React.ReactNode;
};

export type PanelChartSkeletonProps = DivProps;

export type PanelGaugeSkeletonProps = DivProps;

export type PanelRowActionProps = DivProps;

export type PanelRowContentProps = React.ComponentPropsWithRef<
  typeof CollapsiblePrimitive.Content
>;

export type PanelRowGroupProps = DivProps;

export type PanelDividerLabelProps = DivProps;

export type PanelCalloutProps = DivProps & {
  icon?: Icons;
  variant?: 'neutral' | 'warning' | 'critical';
};

export type PanelSectionProps = DivProps;

export type PanelSectionTitleProps = React.ComponentProps<typeof Text>;

export type PanelSectionDescriptionProps = React.ComponentProps<typeof Text>;

export type PanelCheckboxItemProps = Omit<DivProps, 'onChange'> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  controlAriaLabel?: string;
};

export type PanelTableProps = DivProps & {
  size?: 'sm' | 'xs';
  stretch?: boolean;
  fillTable?: boolean;
  scrollerRef?: React.Ref<HTMLDivElement>;
};

export type PanelFieldListProps = DivProps & {
  label?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'plain' | 'divided' | 'bordered';
  size?: 'sm' | 'xs';
};

export type PanelFieldProps = DivProps & {
  label: React.ReactNode;
  value?: React.ReactNode;
  mono?: boolean;
  copyValue?: string;
  href?: string;
};

export type PanelDataTableSort = {
  key: string;
  dir: 'asc' | 'desc';
};

export type PanelDataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  sort?: 'auto' | 'severity' | ((a: T, b: T) => number);
  headClassName?: string;
  cellClassName?: string;
  minWidth?: number;
  pinned?: 'left' | 'right';
};

export type PanelDataTableProps<T> = {
  data: T[] | undefined;
  columns: PanelDataTableColumn<T>[];
  getRowKey: (row: T, index: number) => string | number;
  isLoading?: boolean;
  isError?: boolean;
  emptyMessage?: React.ReactNode;
  emptyIcon?: Icons;
  emptyDescription?: React.ReactNode;
  errorMessage?: React.ReactNode;
  size?: 'sm' | 'xs';
  className?: string;
  defaultSort?: PanelDataTableSort;
  sort?: PanelDataTableSort | null;
  onSortChange?: (sort: PanelDataTableSort | null) => void;
  searchTerm?: string;
  getSearchText?: (row: T) => string;
  filter?: (row: T) => boolean;
  pageSize?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  totalCount?: number;
  manual?: boolean;
  stretch?: boolean;
};

export type PanelTableHeaderProps = React.ComponentPropsWithRef<'thead'>;

export type PanelTableHeadProps = React.ComponentPropsWithRef<'th'> & {
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
};

export type PanelTableBodyProps = React.ComponentPropsWithRef<'tbody'>;

export type PanelTableRowProps = React.ComponentPropsWithRef<'tr'>;

export type PanelTableCellProps = React.ComponentPropsWithRef<'td'>;

export type PanelRowSkeletonProps = DivProps & {
  withDescription?: boolean;
};

export type PanelHeaderSkeletonProps = DivProps;

export type PanelStatsProps = DivProps;

export type PanelStatProps = Omit<
  React.ComponentPropsWithRef<'button'>,
  'value' | 'color'
> & {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: Icons;
  color?: string;
  selected?: boolean;
};

export type PanelToolbarProps = DivProps;

export type PanelToolbarStartProps = DivProps;

export type PanelToolbarEndProps = DivProps;

export type PanelSplitProps = DivProps;

export type PanelNavListProps = DivProps;

export type PanelNavItemProps = Omit<
  React.ComponentPropsWithRef<'button'>,
  'title'
> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  accentColor?: string;
  icon?: Icons;
  trailing?: React.ReactNode;
  selected?: boolean;
  showChevron?: boolean;
};

export type PanelViewProps = Omit<
  React.ComponentPropsWithoutRef<typeof motion.div>,
  'children'
> & {
  viewKey: string;
  children: React.ReactNode;
};
