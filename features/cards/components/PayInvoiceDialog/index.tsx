'use client';

import { AccountSelect, type AccountOption } from '@/components/finance/AccountSelect';
import { MoneyInput } from '@/components/finance/MoneyInput';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { DialogClose, makeResponsiveDialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Spinner } from '@/components/ui/Spinner';
import { type PayInvoiceState, initialPayInvoiceState } from '@/features/cards/schemas';
import type { InvoiceSummary } from '@/features/cards/types';
import { formatMonth } from '@/lib/dates';
import * as React from 'react';

export type PayInvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceSummary;
  /** Contas que podem pagar (sem cartões). */
  accounts: AccountOption[];
  defaultAccountId: string | null;
  today: string;
  action: (state: PayInvoiceState, formData: FormData) => Promise<PayInvoiceState>;
  onPaid?: () => void;
};

const FORM_ID = 'pay-invoice-form';

export function PayInvoiceDialog(props: PayInvoiceDialogProps) {
  const [openCount, setOpenCount] = React.useState(0);
  const [wasOpen, setWasOpen] = React.useState(props.open);
  if (props.open !== wasOpen) {
    setWasOpen(props.open);
    if (props.open) {
      setOpenCount((count) => count + 1);
    }
  }
  return <PayInvoiceDialogContent key={openCount} {...props} />;
}

/** Paga a fatura com uma transferência da conta escolhida para o cartão. */
function PayInvoiceDialogContent({
  open,
  onOpenChange,
  invoice,
  accounts,
  defaultAccountId,
  today,
  action,
  onPaid,
}: PayInvoiceDialogProps) {
  const [state, formAction, isPending] = React.useActionState(action, initialPayInvoiceState);
  const error = state.status === 'error' ? state : null;

  React.useEffect(() => {
    if (state.status === 'paid') {
      onPaid?.();
      onOpenChange(false);
    }
    // Só reage à mudança de estado da action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return makeResponsiveDialog({
    title: `Pagar fatura de ${formatMonth(invoice.referenceMonth).toLowerCase()}`,
    description: 'Registra uma transferência da conta para o cartão e marca a fatura como paga.',
    open,
    onOpenChange,
    contentProps: { className: 'max-w-[480px]' },
    children: (
      <form id={FORM_ID} action={formAction} className="flex flex-col gap-4" noValidate>
        <Field label="Pagar com" error={error?.fieldErrors.fromAccountId}>
          {(control) => (
            <AccountSelect
              {...control}
              name="fromAccountId"
              accounts={accounts}
              defaultValue={defaultAccountId}
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor pago" error={error?.fieldErrors.amountCents}>
            {(control) => (
              <MoneyInput {...control} name="amountCents" defaultValue={Math.abs(invoice.totalCents)} />
            )}
          </Field>
          <Field label="Data do pagamento" error={error?.fieldErrors.date}>
            {(control) => <DatePicker {...control} name="date" defaultValue={today} />}
          </Field>
        </div>
        {error && (
          <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
            {error.message}
          </Panel.Callout>
        )}
      </form>
    ),
    footer: (
      <>
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit" form={FORM_ID} disabled={isPending}>
          {isPending && <Spinner label={null} data-icon="inline-start" />}
          {isPending ? 'Pagando…' : 'Confirmar pagamento'}
        </Button>
      </>
    ),
  });
}
