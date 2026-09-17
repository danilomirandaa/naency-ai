import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { List } from '@/components/ui/List';
import type { ImportBatchSummary } from '@/features/imports/types';
import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';

const STATUS: Record<ImportBatchSummary['status'], { label: string; color: 'blue' | 'green' | 'gray' }> = {
  review: { label: 'Em revisão', color: 'blue' },
  committed: { label: 'Importado', color: 'green' },
  discarded: { label: 'Descartado', color: 'gray' },
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

/** Importações recentes; as em revisão voltam para a tela de revisão. */
export function ImportHistory({ batches, reviewHref }: { batches: ImportBatchSummary[]; reviewHref: (id: string) => string }) {
  if (batches.length === 0) {
    return null;
  }
  return (
    <Panel.Root>
      <Panel.Header>
        <Panel.HeaderText>
          <Panel.Title>Importações recentes</Panel.Title>
        </Panel.HeaderText>
      </Panel.Header>
      <Panel.Body>
        <List.Root aria-label="Importações recentes">
          {batches.map((batch) => (
            <List.Item key={batch.id}>
              <span aria-hidden className="flex size-8 items-center justify-center rounded-control-sm bg-background-neutral-100 [&_svg]:size-4">
                <Icon icon="invoice" />
              </span>
              <List.ItemText>
                <Text size="sm" weight="medium" className="truncate">
                  {batch.status === 'review' ? (
                    <Link href={reviewHref(batch.id)} className="underline-offset-4 hover:underline">
                      {batch.fileName}
                    </Link>
                  ) : (
                    batch.fileName
                  )}
                </Text>
                <Text size="xs" color="secondary">
                  {batch.accountName} · {batch.rowCount} linhas · {dateFormatter.format(new Date(batch.createdAt))}
                </Text>
              </List.ItemText>
              <Panel.RowBadge color={STATUS[batch.status].color}>{STATUS[batch.status].label}</Panel.RowBadge>
            </List.Item>
          ))}
        </List.Root>
      </Panel.Body>
    </Panel.Root>
  );
}
