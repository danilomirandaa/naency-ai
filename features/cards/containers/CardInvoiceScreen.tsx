'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { accountsQuery } from '@/features/accounts/api/accounts.queries';
import { payInvoiceAction, unpayInvoiceAction } from '@/features/cards/actions';
import { cardsQuery } from '@/features/cards/api/cards.queries';
import { InvoiceHeader } from '@/features/cards/components/InvoiceHeader';
import { PayInvoiceDialog } from '@/features/cards/components/PayInvoiceDialog';
import type { CardSummary } from '@/features/cards/types';
import { TransactionsManager } from '@/features/transactions/containers/TransactionsManager';
import type { TransactionFilters } from '@/features/transactions/filters';
import { currentInvoiceOf } from '@/lib/cards';
import { isMonth, monthRange } from '@/lib/dates';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

export type CardInvoiceScreenProps = {
  workspaceId: string;
  card: Pick<CardSummary, 'id' | 'name' | 'defaultPaymentAccountId'>;
  canEdit: boolean;
  today: string;
};

/** Container: fatura selecionada na URL (?fatura=AAAA-MM), lançamentos dela e pagamento. */
export function CardInvoiceScreen({ workspaceId, card, canEdit, today }: CardInvoiceScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const invoices = useQuery(cardsQuery.invoices(workspaceId, card.id));
  const accounts = useQuery(accountsQuery.options(workspaceId, { includeArchived: false }));
  const [paying, setPaying] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<TransactionFilters['sort']>(null);
  const [unpayFailed, setUnpayFailed] = React.useState(false);

  const list = invoices.data ?? [];
  const requested = searchParams.get('fatura');
  // Sem fatura na URL, abre na atual (lib/cards).
  const selected =
    (isMonth(requested) && list.find((invoice) => invoice.referenceMonth === requested)) ||
    currentInvoiceOf(list, today);

  const filters: TransactionFilters = {
    ...monthRange(selected?.referenceMonth ?? today.slice(0, 7)),
    accountId: card.id,
    categoryId: null,
    kind: null,
    search: '',
    page,
    sort,
    // Fatura ainda sem lançamentos: id inexistente para a lista vir vazia.
    invoiceId: selected?.id ?? '00000000-0000-4000-8000-000000000000',
  };

  const invalidations = [cardsQuery.all(workspaceId)] as const;
  const refresh = () =>
    Promise.all(
      [...invalidations, accountsQuery.all(workspaceId)].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );

  const selectInvoice = (referenceMonth: string) => {
    setPage(1);
    router.replace(`${pathname}?fatura=${referenceMonth}`, { scroll: false });
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title={card.name}
        description="Compras de cada fatura e pagamento."
        actions={
          <Button variant="outline" asChild>
            <Link href="/cartoes">
              <Icon icon="chevron-left" data-icon="inline-start" />
              Cartões
            </Link>
          </Button>
        }
      />
      {unpayFailed && (
        <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
          Não foi possível desfazer o pagamento. Atualize a página e tente de novo.
        </Panel.Callout>
      )}
      {selected ? (
        <>
          <InvoiceHeader
            invoices={list}
            selected={selected}
            onSelect={selectInvoice}
            canEdit={canEdit}
            onPay={() => setPaying(true)}
            onUnpay={async () => {
              if (!selected.id) {
                return;
              }
              const { ok } = await unpayInvoiceAction(workspaceId, selected.id);
              setUnpayFailed(!ok);
              await refresh();
            }}
          />
          <TransactionsManager
            workspaceId={workspaceId}
            canEdit={canEdit}
            filters={filters}
            onPageChange={setPage}
            onSortChange={(next) => {
              setSort(next);
              setPage(1);
            }}
            hiddenColumns={['situation', 'paymentMethod', 'paidAt']}
            isFiltered={false}
            defaultKind="expense"
            today={today}
            extraInvalidations={invalidations}
          />
          {canEdit && selected.id && (
            <PayInvoiceDialog
              open={paying}
              onOpenChange={setPaying}
              invoice={selected}
              accounts={(accounts.data ?? []).filter((account) => account.type !== 'credit_card')}
              defaultAccountId={card.defaultPaymentAccountId}
              today={today}
              action={payInvoiceAction.bind(null, workspaceId, selected.id)}
              onPaid={() => void refresh()}
            />
          )}
        </>
      ) : (
        <Panel.Root>
          <Panel.QueryState isLoading={invoices.isPending} isError={invoices.isError} isEmpty emptyMessage="Nenhuma fatura">
            {null}
          </Panel.QueryState>
        </Panel.Root>
      )}
    </div>
  );
}
