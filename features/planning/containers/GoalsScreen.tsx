'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DeleteDialog } from '@/components/ui/DeleteDialog';
import { Icon } from '@/components/ui/Icon';
import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { deleteGoalAction, saveGoalAction } from '@/features/planning/actions';
import { planningQuery } from '@/features/planning/api/planning.queries';
import { GoalFormDialog } from '@/features/planning/components/GoalFormDialog';
import { GoalsList } from '@/features/planning/components/GoalsList';
import type { GoalSummary } from '@/features/planning/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

/** Container: metas com criar, editar e excluir. */
export function GoalsScreen({ workspaceId, canEdit }: { workspaceId: string; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const goals = useQuery(planningQuery.goals(workspaceId));
  const accounts = useQuery(accountsQuery.options(workspaceId, { includeArchived: false }));
  const [dialog, setDialog] = React.useState<{ goal: GoalSummary | null } | null>(null);
  const [deleting, setDeleting] = React.useState<GoalSummary | null>(null);
  const goalId = dialog?.goal?.id ?? null;
  const action = React.useMemo(() => saveGoalAction.bind(null, workspaceId, goalId), [workspaceId, goalId]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: planningQuery.goalsAll(workspaceId) });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader
        title="Metas"
        description="Acompanhe quanto já guardou para cada objetivo."
        actions={
          canEdit ? (
            <Button onClick={() => setDialog({ goal: null })}>
              <Icon icon="add" data-icon="inline-start" />
              Nova meta
            </Button>
          ) : undefined
        }
      />
      <GoalsList
        goals={goals.data ?? []}
        canEdit={canEdit}
        isLoading={goals.isPending}
        isError={goals.isError}
        onCreate={() => setDialog({ goal: null })}
        onEdit={(goal) => setDialog({ goal })}
        onDelete={setDeleting}
      />
      {canEdit && (
        <>
          <GoalFormDialog
            open={dialog !== null}
            onOpenChange={(open) => !open && setDialog(null)}
            goal={dialog?.goal}
            accounts={accounts.data ?? []}
            action={action}
            onSaved={() => void refresh()}
          />
          <DeleteDialog
            open={deleting !== null}
            onClose={() => setDeleting(null)}
            title="Excluir meta"
            subtitle={`"${deleting?.name ?? ''}" deixa de ser acompanhada. O dinheiro da conta não muda.`}
            onConfirm={async () => {
              if (deleting) {
                await deleteGoalAction(workspaceId, deleting.id);
              }
              setDeleting(null);
              await refresh();
            }}
          />
        </>
      )}
    </div>
  );
}
