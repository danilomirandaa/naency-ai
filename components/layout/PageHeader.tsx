import { Text } from '@/components/ui/Text';
import { classMerge } from '@/lib/utils';
import type * as React from 'react';

export type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Ações principais da página (ex.: "Convidar pessoa"). */
  actions?: React.ReactNode;
  className?: string;
};

/** Título, descrição e ações do topo de uma página do app. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={classMerge(
        'flex flex-col gap-4 py-2 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <Text element="h1" size="2xl" weight="semibold" className="tracking-tight">
          {title}
        </Text>
        {description && (
          <Text element="p" size="sm" color="secondary">
            {description}
          </Text>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
