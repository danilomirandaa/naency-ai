'use client';

import { AccountAvatar } from '@/components/finance/AccountAvatar';
import { MoneyValue } from '@/components/finance/MoneyValue';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { List } from '@/components/ui/List';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import type { AccountSummary } from '@/features/accounts/types';
import { ACCOUNT_TYPE_LABELS } from '@/lib/accounts';
import { useTransition } from 'react';

export type AccountsListProps = {
  accounts: AccountSummary[];
  /** Editor e admin; leitor só vê. */
  canEdit: boolean;
  onCreate: () => void;
  onEdit: (account: AccountSummary) => void;
  onArchiveChange: (account: AccountSummary, archived: boolean) => Promise<void>;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

function accountCountLabel(count: number) {
  return count === 1 ? '1 conta' : `${count} contas`;
}

function ArchiveButton({
  account,
  onArchiveChange,
}: Pick<AccountsListProps, 'onArchiveChange'> & { account: AccountSummary }) {
  const [isPending, startTransition] = useTransition();
  const archive = !account.archived;
  return (
    <Button
      variant="outline"
      size="icon-sm"
      disabled={isPending}
      aria-label={`${archive ? 'Arquivar' : 'Desarquivar'} ${account.name}`}
      onClick={() => startTransition(() => onArchiveChange(account, archive))}
    >
      {isPending ? <Spinner label={null} /> : <Icon icon={archive ? 'archive' : 'unarchive'} />}
    </Button>
  );
}

function AccountRows({
  accounts,
  label,
  canEdit,
  onEdit,
  onArchiveChange,
}: Pick<AccountsListProps, 'accounts' | 'canEdit' | 'onEdit' | 'onArchiveChange'> & {
  label: string;
}) {
  return (
    <List.Root aria-label={label}>
      {accounts.map((account) => (
        <List.Item key={account.id} id={`conta-${account.id}`} className="scroll-mt-20">
          <AccountAvatar type={account.type} institution={account.institution} />
          <List.ItemText>
            <Text size="sm" weight="medium" className="truncate">
              {account.name}
            </Text>
            <Text size="xs" color="secondary" className="truncate">
              {[ACCOUNT_TYPE_LABELS[account.type], account.institution?.name]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </List.ItemText>
          <MoneyValue cents={account.balanceCents} size="sm" className="tabular-nums" />
          {canEdit && (
            <div className="flex items-center gap-1.5">
              {!account.archived && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Editar ${account.name}`}
                  onClick={() => onEdit(account)}
                >
                  <Icon icon="edit" />
                </Button>
              )}
              <ArchiveButton account={account} onArchiveChange={onArchiveChange} />
            </div>
          )}
        </List.Item>
      ))}
    </List.Root>
  );
}

/** Contas do espaço com saldo, total e arquivadas à parte. */
export function AccountsList({
  accounts,
  canEdit,
  onCreate,
  onEdit,
  onArchiveChange,
  isLoading = false,
  isError = false,
  onRetry,
}: AccountsListProps) {
  const active = accounts.filter((account) => !account.archived);
  const archived = accounts.filter((account) => account.archived);
  const totalCents = active.reduce((sum, account) => sum + account.balanceCents, 0);

  return (
    <>
      <Panel.Root>
        <Panel.Header>
          <Panel.HeaderText>
            <Panel.Title>Saldo total</Panel.Title>
            <Panel.Description>
              {isLoading || isError ? 'Contas ativas' : `${accountCountLabel(active.length)} ativas`}
            </Panel.Description>
          </Panel.HeaderText>
          {!isLoading && !isError && (
            <MoneyValue cents={totalCents} size="lg" weight="semibold" className="tabular-nums" />
          )}
        </Panel.Header>
        <Panel.Body>
          <Panel.QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={active.length === 0}
            skeleton={
              <div className="flex w-full flex-col">
                <Panel.RowSkeleton />
                <Panel.RowSkeleton />
              </div>
            }
            errorMessage="Não foi possível carregar as contas"
            errorAction={
              onRetry && (
                <Button variant="outline" onClick={onRetry}>
                  Tentar de novo
                </Button>
              )
            }
            emptyIcon="bank"
            emptyMessage="Nenhuma conta ativa"
            emptyDescription={
              canEdit
                ? 'Cadastre onde seu dinheiro fica para acompanhar os saldos.'
                : 'Quem edita este espaço ainda não cadastrou contas.'
            }
            emptyAction={
              canEdit && (
                <Button onClick={onCreate}>
                  <Icon icon="add" data-icon="inline-start" />
                  Nova conta
                </Button>
              )
            }
          >
            <AccountRows
              accounts={active}
              label="Contas ativas"
              canEdit={canEdit}
              onEdit={onEdit}
              onArchiveChange={onArchiveChange}
            />
          </Panel.QueryState>
        </Panel.Body>
      </Panel.Root>

      {!isLoading && !isError && archived.length > 0 && (
        <Panel.Root>
          <Panel.Header>
            <Panel.HeaderText>
              <Panel.Title>Arquivadas</Panel.Title>
              <Panel.Description>
                Fora das listas e do saldo total. O histórico continua nos relatórios.
              </Panel.Description>
            </Panel.HeaderText>
          </Panel.Header>
          <Panel.Body>
            <AccountRows
              accounts={archived}
              label="Contas arquivadas"
              canEdit={canEdit}
              onEdit={onEdit}
              onArchiveChange={onArchiveChange}
            />
          </Panel.Body>
        </Panel.Root>
      )}
    </>
  );
}
