'use client';

import { AccountAvatar } from '@/components/finance/AccountAvatar';
import { MoneyValue } from '@/components/finance/MoneyValue';
import { Button } from '@/components/ui/Button';
import { DeleteDialog } from '@/components/ui/DeleteDialog';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Spinner } from '@/components/ui/Spinner';
import { Text } from '@/components/ui/Text';
import type { ImportBatchDetail } from '@/features/imports/types';
import { useState, useTransition } from 'react';

export type ImportSummaryProps = {
  batch: ImportBatchDetail;
  canEdit: boolean;
  onCommit: () => Promise<void>;
  onDiscard: () => Promise<void>;
  /** Presente quando a AI está configurada. */
  onSuggest?: () => Promise<void>;
};

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/** Resumo da revisão e as ações de concluir ou descartar. */
export function ImportSummary({ batch, canEdit, onCommit, onDiscard, onSuggest }: ImportSummaryProps) {
  const [isCommitting, startCommit] = useTransition();
  const [isDiscarding, startDiscard] = useTransition();
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [isSuggesting, startSuggest] = useTransition();
  const { summary } = batch;
  // O trabalho roda no servidor: o lote diz o que está acontecendo, mesmo depois de recarregar.
  const committing = isCommitting || batch.job === 'commit';
  const suggesting = isSuggesting || batch.job === 'suggest';
  const busy = committing || suggesting || isDiscarding;
  const reviewing = batch.status === 'review';

  return (
    <Panel.Root>
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <AccountAvatar type={batch.account.type} institution={batch.account.institution} />
          <div className="flex min-w-0 flex-col">
            <Text size="sm" weight="medium" className="truncate">
              {batch.fileName} → {batch.account.name}
            </Text>
            <Text size="xs" color="secondary">
              {plural(summary.included, 'lançamento a importar', 'lançamentos a importar')} de {summary.total}
              {summary.duplicates > 0 && ` · ${plural(summary.duplicates, 'duplicado', 'duplicados')}`}
              {summary.uncategorized > 0 && ` · ${plural(summary.uncategorized, 'sem categoria', 'sem categoria')}`}
            </Text>
            <Text size="xs" color="secondary" className="flex gap-3">
              <span>
                Entradas <MoneyValue cents={summary.incomeCents} kind="income" size="xs" />
              </span>
              <span>
                Saídas <MoneyValue cents={summary.expenseCents} kind="expense" size="xs" />
              </span>
            </Text>
          </div>
        </div>
        {batch.job && (
          <Text size="xs" color="secondary" className="w-full md:w-auto">
            {batch.job === 'suggest' ? 'A AI está lendo os lançamentos.' : 'Criando os lançamentos.'} Pode fechar a
            página: o trabalho continua e avisamos quando terminar.
          </Text>
        )}
        {!reviewing ? (
          <Panel.RowBadge color={batch.status === 'committed' ? 'green' : 'gray'}>
            {batch.status === 'committed' ? 'Importado' : 'Descartado'}
          </Panel.RowBadge>
        ) : (
          canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              {onSuggest && summary.uncategorized > 0 && (
                <Button variant="secondary" disabled={busy} onClick={() => startSuggest(onSuggest)}>
                  {suggesting ? <Spinner label={null} data-icon="inline-start" /> : <Icon icon="category" data-icon="inline-start" />}
                  {suggesting ? 'Sugerindo…' : 'Sugerir com AI'}
                </Button>
              )}
              <Button variant="outline" disabled={busy} onClick={() => setConfirmingDiscard(true)}>
                {isDiscarding ? <Spinner label={null} data-icon="inline-start" /> : <Icon icon="close" data-icon="inline-start" />}
                Descartar
              </Button>
              <Button disabled={busy || summary.included === 0} onClick={() => startCommit(onCommit)}>
                {committing ? <Spinner label={null} data-icon="inline-start" /> : <Icon icon="check" data-icon="inline-start" />}
                {committing ? 'Importando…' : `Importar ${summary.included}`}
              </Button>
            </div>
          )
        )}
      </div>
      <DeleteDialog
        open={confirmingDiscard}
        onClose={() => setConfirmingDiscard(false)}
        title="Descartar importação"
        subtitle={`As ${summary.total} linhas lidas de "${batch.fileName}" serão descartadas.`}
        warnText="Nada entra nos lançamentos. Para importar depois, envie o arquivo de novo."
        deleteButtonText="Descartar"
        onConfirm={async () => {
          setConfirmingDiscard(false);
          startDiscard(onDiscard);
        }}
      />
    </Panel.Root>
  );
}
