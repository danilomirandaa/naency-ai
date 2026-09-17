'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { setBudgetAction } from '@/features/planning/actions';
import { planningQuery } from '@/features/planning/api/planning.queries';
import { BudgetDialog } from '@/features/planning/components/BudgetDialog';
import { BudgetsList } from '@/features/planning/components/BudgetsList';
import type { BudgetLine } from '@/features/planning/types';
import { formatMonth } from '@/lib/dates';
import { resolveRange } from '@/lib/periods';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';

/** Container: orçamentos do mês do período do header. */
export function BudgetsScreen({
  workspaceId,
  canEdit,
  periodCookie,
}: {
  workspaceId: string;
  canEdit: boolean;
  periodCookie: string | null;
}) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  // Orçamento é mensal: vale o mês de início do período do header.
  const month = resolveRange(searchParams, periodCookie).from.slice(0, 7);
  const budgets = useQuery(planningQuery.budgets(workspaceId, month));
  const [editing, setEditing] = React.useState<BudgetLine | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHeader
        title="Orçamentos"
        description={`Quanto gastar por mês em cada categoria · ${formatMonth(month)}`}
      />
      <BudgetsList
        lines={budgets.data ?? []}
        canEdit={canEdit}
        onEdit={setEditing}
        isLoading={budgets.isPending}
        isError={budgets.isError}
      />
      {canEdit && (
        <BudgetDialog
          line={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSave={async (line, amountCents) => {
            const result = await setBudgetAction(workspaceId, line.categoryId, amountCents);
            if (result.ok) {
              await queryClient.invalidateQueries({ queryKey: planningQuery.budgetsAll(workspaceId) });
            }
            return result;
          }}
        />
      )}
    </div>
  );
}
