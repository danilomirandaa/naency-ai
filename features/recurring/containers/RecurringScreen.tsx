'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DeleteDialog } from '@/components/ui/DeleteDialog';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { categoriesQuery } from '@/features/categories/api/categories.queries';
import { dashboardQuery } from '@/features/dashboard/api/dashboard.queries';
import {
  deleteRecurringRuleAction,
  saveRecurringRuleAction,
  setRecurringRuleActiveAction,
} from '@/features/recurring/actions';
import { recurringQuery } from '@/features/recurring/api/recurring.queries';
import { RecurringRuleFormDialog } from '@/features/recurring/components/RecurringRuleFormDialog';
import { RecurringRulesList } from '@/features/recurring/components/RecurringRulesList';
import type { RecurringRuleSummary } from '@/features/recurring/types';
import { transactionsQuery } from '@/features/transactions/api/transactions.queries';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

type DialogState = { rule: RecurringRuleSummary | null } | null;

/** Container: recorrências com criar, editar, pausar e excluir. */
export function RecurringScreen({ workspaceId, canEdit, today }: { workspaceId: string; canEdit: boolean; today: string }) {
  const queryClient = useQueryClient();
  const rules = useQuery(recurringQuery.list(workspaceId));
  const accounts = useQuery(accountsQuery.options(workspaceId, { includeArchived: true }));
  const categories = useQuery(categoriesQuery.options(workspaceId, { includeArchived: false }));
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [deleting, setDeleting] = React.useState<RecurringRuleSummary | null>(null);
  const [failed, setFailed] = React.useState(false);

  const refresh = () =>
    Promise.all(
      [recurringQuery.all(workspaceId), transactionsQuery.all(workspaceId), dashboardQuery.all(workspaceId)].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
  const editingId = dialog?.rule?.id ?? null;
  const action = React.useMemo(() => saveRecurringRuleAction.bind(null, workspaceId, editingId), [workspaceId, editingId]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHeader
        title="Recorrentes"
        description="Contas e receitas que se repetem viram lançamentos previstos."
        actions={
          canEdit ? (
            <Button onClick={() => setDialog({ rule: null })}>
              <Icon icon="add" data-icon="inline-start" />
              Nova recorrência
            </Button>
          ) : undefined
        }
      />
      {failed && (
        <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
          Não foi possível alterar a recorrência. Atualize a página e tente de novo.
        </Panel.Callout>
      )}
      <RecurringRulesList
        rules={rules.data ?? []}
        canEdit={canEdit}
        isLoading={rules.isPending}
        isError={rules.isError}
        onCreate={() => setDialog({ rule: null })}
        onEdit={(rule) => setDialog({ rule })}
        onDelete={setDeleting}
        onActiveChange={async (rule, active) => {
          const { ok } = await setRecurringRuleActiveAction(workspaceId, rule.id, active);
          setFailed(!ok);
          await refresh();
        }}
      />
      {canEdit && (
        <>
          <RecurringRuleFormDialog
            open={dialog !== null}
            onOpenChange={(open) => !open && setDialog(null)}
            rule={dialog?.rule}
            accounts={accounts.data ?? []}
            categories={categories.data ?? []}
            action={action}
            onSaved={() => void refresh()}
            today={today}
          />
          <DeleteDialog
            open={deleting !== null}
            onClose={() => setDeleting(null)}
            title="Excluir recorrência"
            subtitle={`"${deleting?.description ?? ''}" deixa de gerar lançamentos. Os previstos futuros saem; os já efetivados ficam.`}
            onConfirm={async () => {
              if (!deleting) {
                return;
              }
              const { ok } = await deleteRecurringRuleAction(workspaceId, deleting.id);
              setFailed(!ok);
              setDeleting(null);
              await refresh();
            }}
          />
        </>
      )}
    </div>
  );
}
