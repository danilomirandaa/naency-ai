import { Panel } from '@/components/ui/Panel';
import type { Icons } from '@/components/ui/Icon';
import type * as React from 'react';

export type DashboardCardProps = {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  emptyIcon?: Icons;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/** Moldura dos blocos do dashboard: título e estados de carregando, vazio e erro. */
export function DashboardCard({
  title,
  description,
  action,
  isLoading = false,
  isError = false,
  isEmpty = false,
  emptyIcon = 'inbox',
  emptyMessage = 'Nada por aqui ainda',
  emptyDescription,
  emptyAction,
  className,
  children,
}: DashboardCardProps) {
  return (
    <Panel.Root className={className}>
      <Panel.Header>
        <Panel.HeaderText>
          <Panel.Title>{title}</Panel.Title>
          {description && <Panel.Description>{description}</Panel.Description>}
        </Panel.HeaderText>
        {action}
      </Panel.Header>
      <Panel.Body>
        <Panel.QueryState
          isLoading={isLoading}
          isError={isError}
          isEmpty={isEmpty}
          skeleton={
            <div className="flex w-full flex-col">
              <Panel.RowSkeleton />
              <Panel.RowSkeleton />
            </div>
          }
          errorMessage="Não foi possível carregar"
          emptyIcon={emptyIcon}
          emptyMessage={emptyMessage}
          emptyDescription={emptyDescription}
          emptyAction={emptyAction}
        >
          {children}
        </Panel.QueryState>
      </Panel.Body>
    </Panel.Root>
  );
}
