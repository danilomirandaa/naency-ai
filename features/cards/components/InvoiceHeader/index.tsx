'use client';

import { MoneyValue } from '@/components/finance/MoneyValue';
import { Button } from '@/components/ui/Button';
import { DeleteDialog } from '@/components/ui/DeleteDialog';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Spinner } from '@/components/ui/Spinner';
import { Text } from '@/components/ui/Text';
import { INVOICE_STATUS_BADGE } from '@/features/cards/components/CardsList';
import type { InvoiceSummary } from '@/features/cards/types';
import { INVOICE_STATUS_LABELS } from '@/lib/cards';
import { formatIsoDate, formatMonth } from '@/lib/dates';
import { useState, useTransition } from 'react';

export type InvoiceHeaderProps = {
  /** Faturas do cartão, da mais recente para a mais antiga. */
  invoices: InvoiceSummary[];
  selected: InvoiceSummary;
  onSelect: (referenceMonth: string) => void;
  canEdit: boolean;
  onPay: () => void;
  onUnpay: () => Promise<void>;
};

/** Navegação entre faturas, total, datas, status e pagamento. */
export function InvoiceHeader({ invoices, selected, onSelect, canEdit, onPay, onUnpay }: InvoiceHeaderProps) {
  const [isUnpaying, startUnpay] = useTransition();
  const [confirmingUnpay, setConfirmingUnpay] = useState(false);
  const index = invoices.findIndex((invoice) => invoice.referenceMonth === selected.referenceMonth);
  const newer = index > 0 ? invoices[index - 1] : undefined;
  const older = index >= 0 && index < invoices.length - 1 ? invoices[index + 1] : undefined;
  const canPay = canEdit && selected.status !== 'paid' && selected.id !== null && selected.totalCents < 0;

  return (
    <Panel.Root>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <div role="group" aria-label="Fatura" className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Fatura anterior"
              disabled={!older}
              onClick={() => older && onSelect(older.referenceMonth)}
            >
              <Icon icon="chevron-left" />
            </Button>
            <Text size="sm" weight="medium" aria-live="polite" className="min-w-44 text-center">
              Fatura de {formatMonth(selected.referenceMonth).toLowerCase()}
            </Text>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Próxima fatura"
              disabled={!newer}
              onClick={() => newer && onSelect(newer.referenceMonth)}
            >
              <Icon icon="chevron-right" />
            </Button>
          </div>
          <div className="flex items-center gap-3 px-2">
            <MoneyValue
              cents={Math.abs(selected.totalCents)}
              kind="neutral"
              size="2xl"
              weight="semibold"
              className="tabular-nums"
            />
            <Panel.RowBadge color={INVOICE_STATUS_BADGE[selected.status]}>
              {INVOICE_STATUS_LABELS[selected.status]}
            </Panel.RowBadge>
          </div>
          <Text size="xs" color="secondary" className="px-2">
            Fecha {formatIsoDate(selected.closingDate)} · vence {formatIsoDate(selected.dueDate)}
          </Text>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 px-2 sm:px-0">
            {canPay && (
              <Button onClick={onPay}>
                <Icon icon="check" data-icon="inline-start" />
                Pagar fatura
              </Button>
            )}
            {selected.status === 'paid' && (
              <Button variant="outline" disabled={isUnpaying} onClick={() => setConfirmingUnpay(true)}>
                {isUnpaying ? <Spinner label={null} data-icon="inline-start" /> : <Icon icon="return" data-icon="inline-start" />}
                Desfazer pagamento
              </Button>
            )}
          </div>
        )}
      </div>
      <DeleteDialog
        open={confirmingUnpay}
        onClose={() => setConfirmingUnpay(false)}
        title="Desfazer pagamento"
        subtitle={`O pagamento da fatura de ${formatMonth(selected.referenceMonth).toLowerCase()} será excluído.`}
        warnText="A transferência some das duas contas e a fatura volta a ficar em aberto."
        deleteButtonText="Desfazer pagamento"
        deleteButtonIcon="return"
        onConfirm={async () => {
          setConfirmingUnpay(false);
          startUnpay(onUnpay);
        }}
      />
    </Panel.Root>
  );
}
