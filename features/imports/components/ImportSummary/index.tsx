'use client';

import { AccountAvatar } from '@/components/finance/AccountAvatar';
import { MoneyValue } from '@/components/finance/MoneyValue';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Spinner } from '@/components/ui/Spinner';
import { Text } from '@/components/ui/Text';
import type { ImportBatchDetail } from '@/features/imports/types';
import { useTransition } from 'react';

export type ImportSummaryProps = {
  batch: ImportBatchDetail;
  canEdit: boolean;
  onCommit: () => Promise<void>;
  onDiscard: () => Promise<void>;
};

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/** Resumo da revisão e as ações de concluir ou descartar. */
export function ImportSummary({ batch, canEdit, onCommit, onDiscard }: ImportSummaryProps) {
  const [isCommitting, startCommit] = useTransition();
  const [isDiscarding, startDiscard] = useTransition();
  const { summary } = batch;
  const busy = isCommitting || isDiscarding;
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
        {!reviewing ? (
          <Panel.RowBadge color={batch.status === 'committed' ? 'green' : 'gray'}>
            {batch.status === 'committed' ? 'Importado' : 'Descartado'}
          </Panel.RowBadge>
        ) : (
          canEdit && (
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={busy} onClick={() => startDiscard(onDiscard)}>
                {isDiscarding ? <Spinner label={null} data-icon="inline-start" /> : <Icon icon="close" data-icon="inline-start" />}
                Descartar
              </Button>
              <Button disabled={busy || summary.included === 0} onClick={() => startCommit(onCommit)}>
                {isCommitting ? <Spinner label={null} data-icon="inline-start" /> : <Icon icon="check" data-icon="inline-start" />}
                {isCommitting ? 'Importando…' : `Importar ${summary.included}`}
              </Button>
            </div>
          )
        )}
      </div>
    </Panel.Root>
  );
}
