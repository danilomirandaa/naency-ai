'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import {
  createAccountAction,
  setAccountArchivedAction,
  updateAccountAction,
} from '@/features/accounts/actions';
import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { AccountFormDialog } from '@/features/accounts/components/AccountFormDialog';
import { AccountsList } from '@/features/accounts/components/AccountsList';
import type { AccountSummary, InstitutionSummary } from '@/features/accounts/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

export type AccountsScreenProps = {
  workspaceId: string;
  workspaceName: string;
  canEdit: boolean;
  institutions: InstitutionSummary[];
  today: string;
  /** Abre o formulário ao entrar: "Nova conta" (sidebar) ou "Novo cartão" (/cartoes). */
  startCreating?: 'account' | 'card' | null;
};

type DialogState = { mode: 'create'; card: boolean } | { mode: 'edit'; account: AccountSummary } | null;

/**
 * Container: liga o contrato de query e as Server Actions aos componentes.
 * Sem markup próprio; a interface está nos componentes com story.
 */
export function AccountsScreen({
  workspaceId,
  workspaceName,
  canEdit,
  institutions,
  today,
  startCreating = null,
}: AccountsScreenProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const accounts = useQuery(accountsQuery.options(workspaceId, { includeArchived: true }));
  const [dialog, setDialog] = React.useState<DialogState>(
    canEdit && startCreating ? { mode: 'create', card: startCreating === 'card' } : null,
  );
  // Clicar em "Nova conta" já estando nesta página só muda o parâmetro da URL:
  // sem reagir à mudança, o formulário não abriria de novo.
  const [lastStartCreating, setLastStartCreating] = React.useState(startCreating);
  if (startCreating !== lastStartCreating) {
    setLastStartCreating(startCreating);
    if (canEdit && startCreating) {
      setDialog({ mode: 'create', card: startCreating === 'card' });
    }
  }
  const [archiveFailed, setArchiveFailed] = React.useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: accountsQuery.all(workspaceId) });

  const editing = dialog?.mode === 'edit' ? dialog.account : null;
  const action = React.useMemo(
    () =>
      editing
        ? updateAccountAction.bind(null, workspaceId, editing.id)
        : createAccountAction.bind(null, workspaceId),
    [editing, workspaceId],
  );

  const handleOpenChange = (open: boolean) => {
    if (open) {
      return;
    }
    setDialog(null);
    if (startCreating) {
      router.replace(pathname);
    }
  };

  const handleArchiveChange = async (account: AccountSummary, archived: boolean) => {
    const { ok } = await setAccountArchivedAction(workspaceId, account.id, archived);
    setArchiveFailed(!ok);
    await invalidate();
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="Contas"
        description={`Onde fica o dinheiro de ${workspaceName}.`}
        actions={
          canEdit ? (
            <Button onClick={() => setDialog({ mode: 'create', card: false })}>
              <Icon icon="add" data-icon="inline-start" />
              Nova conta
            </Button>
          ) : undefined
        }
      />
      {archiveFailed && (
        <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
          Não foi possível alterar a conta. Atualize a página e tente de novo.
        </Panel.Callout>
      )}
      <AccountsList
        accounts={accounts.data ?? []}
        isLoading={accounts.isPending}
        isError={accounts.isError}
        onRetry={() => void accounts.refetch()}
        canEdit={canEdit}
        onCreate={() => setDialog({ mode: 'create', card: false })}
        onEdit={(account) => setDialog({ mode: 'edit', account })}
        onArchiveChange={handleArchiveChange}
      />
      {canEdit && (
        <AccountFormDialog
          open={dialog !== null}
          onOpenChange={handleOpenChange}
          account={editing}
          institutions={institutions}
          action={action}
          onSaved={() => void invalidate()}
          today={today}
          defaultType={dialog?.mode === 'create' && dialog.card ? 'credit_card' : undefined}
          paymentAccounts={(accounts.data ?? []).filter((item) => !item.archived)}
        />
      )}
    </div>
  );
}
