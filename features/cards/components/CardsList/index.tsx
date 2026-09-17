import { InstitutionLogo } from '@/components/finance/InstitutionLogo';
import { LimitUsage } from '@/components/finance/LimitUsage';
import { MoneyValue } from '@/components/finance/MoneyValue';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import type { CardSummary } from '@/features/cards/types';
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@/lib/cards';
import { formatIsoDate, formatMonth } from '@/lib/dates';
import Link from 'next/link';

export const INVOICE_STATUS_BADGE: Record<InvoiceStatus, 'blue' | 'gray' | 'green'> = {
  open: 'blue',
  closed: 'gray',
  paid: 'green',
};

export type CardsListProps = {
  cards: CardSummary[];
  canEdit: boolean;
  /** Link para criar um cartão (conta do tipo cartão). */
  newCardHref: string;
  isLoading?: boolean;
  isError?: boolean;
};

/** Cartões com a fatura atual, o vencimento e o uso do limite. */
export function CardsList({ cards, canEdit, newCardHref, isLoading = false, isError = false }: CardsListProps) {
  const active = cards.filter((card) => !card.archived);

  if (isLoading || isError || active.length === 0) {
    return (
      <Panel.Root>
        <Panel.QueryState
          isLoading={isLoading}
          isError={isError}
          isEmpty
          errorMessage="Não foi possível carregar os cartões"
          emptyIcon="credit-card"
          emptyMessage="Nenhum cartão cadastrado"
          emptyDescription={canEdit ? 'Cadastre o cartão com os dias de fechamento e vencimento para acompanhar as faturas.' : undefined}
          emptyAction={
            canEdit && (
              <Button asChild>
                <Link href={newCardHref}>
                  <Icon icon="add" data-icon="inline-start" />
                  Novo cartão
                </Link>
              </Button>
            )
          }
        >
          {null}
        </Panel.QueryState>
      </Panel.Root>
    );
  }

  return (
    <ul aria-label="Cartões" className="grid gap-4 md:grid-cols-2">
      {active.map((card) => {
        const invoice = card.currentInvoice;
        return (
          <li key={card.id}>
            <Panel.Root className="h-full">
              <Link
                href={`/cartoes/${card.id}`}
                className="flex h-full flex-col gap-4 rounded-[inherit] p-4 outline-hidden transition-colors hover:bg-background-neutral-100 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="flex items-center gap-3">
                  {card.institution ? (
                    <InstitutionLogo name={card.institution.name} color={card.institution.color} />
                  ) : (
                    <span aria-hidden className="flex size-8 items-center justify-center rounded-control-sm bg-background-neutral-100 [&_svg]:size-4">
                      <Icon icon="credit-card" />
                    </span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Text size="sm" weight="medium" className="truncate">
                      {card.name}
                    </Text>
                    <Text size="xs" color="secondary">
                      Fecha dia {card.closingDay} · vence dia {card.dueDay}
                    </Text>
                  </div>
                  <Icon icon="chevron-right" className="size-4 text-icon-neutral-rest" />
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <Text size="xs" color="secondary">
                      Fatura de {formatMonth(invoice.referenceMonth).toLowerCase()}
                    </Text>
                    <MoneyValue cents={Math.abs(invoice.totalCents)} size="lg" weight="semibold" kind="neutral" className="tabular-nums" />
                    <Text size="xs" color="secondary">
                      Vence {formatIsoDate(invoice.dueDate)}
                    </Text>
                  </div>
                  <Panel.RowBadge color={INVOICE_STATUS_BADGE[invoice.status]}>
                    {INVOICE_STATUS_LABELS[invoice.status]}
                  </Panel.RowBadge>
                </div>
                {card.limitCents !== null && (
                  <LimitUsage limitCents={card.limitCents} usedCents={-card.balanceCents} />
                )}
              </Link>
            </Panel.Root>
          </li>
        );
      })}
    </ul>
  );
}
