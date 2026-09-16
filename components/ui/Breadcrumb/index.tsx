import { Icon } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import type * as React from 'react';

export type BreadcrumbRootProps = React.ComponentProps<'nav'>;
export type BreadcrumbListProps = React.ComponentProps<'ol'>;
export type BreadcrumbItemProps = React.ComponentProps<'li'>;
export type BreadcrumbLinkProps = React.ComponentProps<'a'> & {
  /** Renderiza o filho (ex.: `next/link`) no lugar do `<a>`. */
  asChild?: boolean;
};
export type BreadcrumbPageProps = React.ComponentProps<'span'>;
export type BreadcrumbSeparatorProps = React.ComponentProps<'li'>;

function BreadcrumbRoot(props: BreadcrumbRootProps) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}
BreadcrumbRoot.displayName = 'Breadcrumb.Root';

function BreadcrumbList({ className, ...props }: BreadcrumbListProps) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={classMerge(
        'flex flex-wrap items-center gap-1.5 break-words text-sm text-typography-neutral-secondary sm:gap-2.5',
        className,
      )}
      {...props}
    />
  );
}
BreadcrumbList.displayName = 'Breadcrumb.List';

function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={classMerge('inline-flex items-center gap-1.5', className)}
      {...props}
    />
  );
}
BreadcrumbItem.displayName = 'Breadcrumb.Item';

function BreadcrumbLink({ asChild, className, ...props }: BreadcrumbLinkProps) {
  const Comp = asChild ? Slot : 'a';

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={classMerge(
        'transition-colors hover:text-typography-neutral-primary',
        className,
      )}
      {...props}
    />
  );
}
BreadcrumbLink.displayName = 'Breadcrumb.Link';

function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={classMerge(
        'font-medium text-typography-neutral-primary',
        className,
      )}
      {...props}
    />
  );
}
BreadcrumbPage.displayName = 'Breadcrumb.Page';

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: BreadcrumbSeparatorProps) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={classMerge('[&>svg]:size-3.5', className)}
      {...props}
    >
      {children ?? <Icon icon="chevron-right" />}
    </li>
  );
}
BreadcrumbSeparator.displayName = 'Breadcrumb.Separator';

const Breadcrumb = Object.assign(
  () => {
    throw new Error(
      'Breadcrumb is not a component. Render Breadcrumb.Root instead.',
    );
  },
  {
    Root: BreadcrumbRoot,
    List: BreadcrumbList,
    Item: BreadcrumbItem,
    Link: BreadcrumbLink,
    Page: BreadcrumbPage,
    Separator: BreadcrumbSeparator,
  },
);

export {
  Breadcrumb,
  BreadcrumbRoot,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
