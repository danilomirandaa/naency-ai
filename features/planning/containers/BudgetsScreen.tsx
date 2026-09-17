'use client';

import { MonthPicker } from '@/components/finance/MonthPicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { setBudgetAction } from '@/features/planning/actions';
import { planningQuery } from '@/features/planning/api/planning.queries';
import { BudgetDialog } from '@/features/planning/components/BudgetDialog';
import { BudgetsList } from '@/features/planning/components/BudgetsList';
import type { BudgetLine } from '@/features/planning/types';
import { currentMonth, isMonth } from '@/lib/dates';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

/** Container: orçamentos do mês escolhido (?mes=). */
export function BudgetsScreen({ workspaceId, canEdit }: { workspaceId: string; canEdit: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const requested = searchParams.get('mes');
  const month = isMonth(requested) ? requested : currentMonth();
  const budgets = useQuery(planningQuery.budgets(workspaceId, month));
  const [editing, setEditing] = React.useState<BudgetLine | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHeader
        title="Orçamentos"
        description="Quanto gastar por mês em cada categoria."
        actions={
          <MonthPicker
            value={month}
            onValueChange={(next) => router.replace(next === currentMonth() ? pathname : `${pathname}?mes=${next}`, { scroll: false })}
          />
        }
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
