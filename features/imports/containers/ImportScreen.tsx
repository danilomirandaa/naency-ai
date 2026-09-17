'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { cardsQuery } from '@/features/cards/api/cards.queries';
import { categoriesQuery } from '@/features/categories/api/categories.queries';
import {
  commitImportAction,
  createImportAction,
  discardImportAction,
  updateImportRowAction,
} from '@/features/imports/actions';
import { importsQuery } from '@/features/imports/api/imports.queries';
import { ImportHistory } from '@/features/imports/components/ImportHistory';
import { ImportReviewTable } from '@/features/imports/components/ImportReviewTable';
import { ImportSummary } from '@/features/imports/components/ImportSummary';
import { ImportUploadForm } from '@/features/imports/components/ImportUploadForm';
import { transactionsQuery } from '@/features/transactions/api/transactions.queries';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

export type ImportScreenProps = {
  workspaceId: string;
  canImport: boolean;
};

/** Container: envio do arquivo, revisão do lote (?lote=) e conclusão. */
export function ImportScreen({ workspaceId, canImport }: ImportScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const batchId = searchParams.get('lote');
  const defaultAccountId = searchParams.get('conta');

  const accounts = useQuery(accountsQuery.options(workspaceId, { includeArchived: true }));
  const categories = useQuery(categoriesQuery.options(workspaceId, { includeArchived: false }));
  const history = useQuery({ ...importsQuery.list(workspaceId), enabled: !batchId });
  const batch = useQuery({ ...importsQuery.batch(workspaceId, batchId ?? ''), enabled: Boolean(batchId) });
  const [message, setMessage] = React.useState<string | null>(null);

  const goTo = (query: string) => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });

  const refreshAfterCommit = () =>
    Promise.all(
      [
        importsQuery.all(workspaceId),
        transactionsQuery.all(workspaceId),
        accountsQuery.all(workspaceId),
        cardsQuery.all(workspaceId),
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader
        title="Importar extrato"
        description="Leia o OFX ou CSV do banco, revise e importe de uma vez."
        actions={
          batchId ? (
            <Button variant="outline" onClick={() => goTo('')}>
              <Icon icon="chevron-left" data-icon="inline-start" />
              Nova importação
            </Button>
          ) : undefined
        }
      />
      {message && (
        <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
          {message}
        </Panel.Callout>
      )}

      {!batchId && (
        <>
          {canImport ? (
            <ImportUploadForm
              accounts={accounts.data ?? []}
              defaultAccountId={defaultAccountId}
              onSubmit={(input) => createImportAction(workspaceId, input)}
              onCreated={(id) => goTo(`lote=${id}`)}
            />
          ) : (
            <Panel.Callout variant="neutral" icon="info-icon" className="mt-0">
              Seu papel neste espaço permite ver as importações, mas não importar.
            </Panel.Callout>
          )}
          <ImportHistory batches={history.data ?? []} reviewHref={(id) => `${pathname}?lote=${id}`} />
        </>
      )}

      {batchId && batch.data && (
        <>
          <ImportSummary
            batch={batch.data}
            canEdit={canImport}
            onCommit={async () => {
              const result = await commitImportAction(workspaceId, batch.data.id);
              if (!result.ok) {
                setMessage(result.message);
                return;
              }
              setMessage(null);
              await refreshAfterCommit();
              router.push(`/transacoes?conta=${result.accountId}`);
            }}
            onDiscard={async () => {
              const result = await discardImportAction(workspaceId, batch.data.id);
              setMessage(result.ok ? null : result.message);
              await queryClient.invalidateQueries({ queryKey: importsQuery.all(workspaceId) });
              if (result.ok) {
                goTo('');
              }
            }}
          />
          <ImportReviewTable
            rows={batch.data.rows}
            categories={categories.data ?? []}
            readOnly={!canImport || batch.data.status !== 'review'}
            onRowChange={async (row, changes) => {
              const queryKey = importsQuery.batch(workspaceId, batch.data.id).queryKey;
              // Otimista: a linha muda na hora e volta se o servidor recusar.
              const previous = queryClient.getQueryData(queryKey);
              queryClient.setQueryData(queryKey, (current) =>
                current
                  ? { ...current, rows: current.rows.map((item) => (item.id === row.id ? { ...item, ...changes } : item)) }
                  : current,
              );
              const result = await updateImportRowAction(workspaceId, row.id, changes);
              if (!result.ok) {
                queryClient.setQueryData(queryKey, previous);
                setMessage(result.message);
              } else {
                setMessage(null);
              }
              await queryClient.invalidateQueries({ queryKey });
            }}
          />
          {batch.data.status === 'committed' && (
            <Button variant="outline" asChild className="self-start">
              <Link href={`/transacoes?conta=${batch.data.account.id}`}>Ver lançamentos da conta</Link>
            </Button>
          )}
        </>
      )}
      {batchId && batch.isPending && (
        <Panel.Root>
          <Panel.QueryState isLoading>{null}</Panel.QueryState>
        </Panel.Root>
      )}
      {batchId && batch.isError && (
        <Panel.Root>
          <Panel.QueryState isError errorMessage="Importação não encontrada">
            {null}
          </Panel.QueryState>
        </Panel.Root>
      )}
    </div>
  );
}
