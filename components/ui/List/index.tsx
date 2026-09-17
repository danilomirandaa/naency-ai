import { classMerge } from '@/lib/utils';
import type * as React from 'react';

export type ListRootProps = React.ComponentProps<'ul'> & {
  /** Nome da lista para leitores de tela. */
  'aria-label': string;
};

function ListRoot({ className, ...props }: ListRootProps) {
  return <ul data-slot="list" className={classMerge('flex flex-col', className)} {...props} />;
}
ListRoot.displayName = 'List.Root';

/** Linha com mídia à esquerda, texto flexível e ações à direita. */
function ListItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="list-item"
      className={classMerge(
        'flex items-center gap-3 border-border-neutral-subtle border-b px-4 py-3 last:border-b-0',
        className,
      )}
      {...props}
    />
  );
}
ListItem.displayName = 'List.Item';

/** Área de texto que encolhe e trunca. */
function ListItemText({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={classMerge('flex min-w-0 flex-1 flex-col', className)} {...props} />;
}
ListItemText.displayName = 'List.ItemText';

export const List = { Root: ListRoot, Item: ListItem, ItemText: ListItemText };
export { ListItem, ListItemText, ListRoot };
