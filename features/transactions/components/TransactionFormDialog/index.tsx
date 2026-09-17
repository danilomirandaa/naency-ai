'use client';

import { AccountSelect, type AccountOption } from '@/components/finance/AccountSelect';
import { CategorySelect, type CategoryOption } from '@/components/finance/CategorySelect';
import { MoneyInput } from '@/components/finance/MoneyInput';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { DialogClose, makeResponsiveDialog } from '@/components/ui/Dialog';
import { Field, Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Switch } from '@/components/ui/Switch';
import { Tabs } from '@/components/ui/Tabs';
import { Text } from '@/components/ui/Text';
import {
  type TransactionFieldName,
  type TransactionFormState,
  type TransactionFormValues,
  initialTransactionFormState,
} from '@/features/transactions/schemas';
import type { TransactionItem } from '@/features/transactions/types';
import { TRANSACTION_KINDS, TRANSACTION_KIND_LABELS, type TransactionKind } from '@/lib/transactions';
import * as React from 'react';

export type TransactionFormAction = (
  state: TransactionFormState,
  formData: FormData,
) => Promise<TransactionFormState>;

export type TransactionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Com lançamento, edita; sem, cria. */
  transaction?: TransactionItem | null;
  defaultKind?: TransactionKind;
  /** Conta sugerida ao criar (ex.: filtro ativo). */
  defaultAccountId?: string | null;
  accounts: AccountOption[];
  categories: CategoryOption[];
  action: TransactionFormAction;
  onSaved?: (transactionId: string) => void;
  /** "AAAA-MM-DD" sugerido para lançamentos novos. */
  today: string;
};

const FORM_ID = 'transaction-form';

const STATUS_LABELS: Record<TransactionKind, string> = {
  expense: 'Já foi pago',
  income: 'Já foi recebido',
  transfer: 'Já foi transferido',
};

export function TransactionFormDialog(props: TransactionFormDialogProps) {
  const [openCount, setOpenCount] = React.useState(0);
  const [wasOpen, setWasOpen] = React.useState(props.open);
  if (props.open !== wasOpen) {
    setWasOpen(props.open);
    if (props.open) {
      setOpenCount((count) => count + 1);
    }
  }
  return <TransactionFormDialogContent key={openCount} {...props} />;
}

function valuesFromTransaction(
  transaction: TransactionItem | null | undefined,
  { defaultKind, defaultAccountId, today }: Pick<TransactionFormDialogProps, 'defaultKind' | 'defaultAccountId' | 'today'>,
): TransactionFormValues {
  if (!transaction) {
    return {
      kind: defaultKind ?? 'expense',
      amountCents: null,
      date: today,
      description: '',
      status: 'cleared',
      notes: '',
      accountId: defaultAccountId ?? '',
      toAccountId: '',
      categoryId: '',
      installments: '1',
    };
  }
  const isIncomingLeg = transaction.kind === 'transfer' && transaction.amountCents > 0;
  return {
    kind: transaction.kind,
    amountCents: Math.abs(transaction.amountCents),
    date: transaction.date,
    description: transaction.description,
    status: transaction.status,
    notes: transaction.notes ?? '',
    // Transferência sempre editada como origem → destino.
    accountId: isIncomingLeg ? (transaction.transfer?.counterpartAccountId ?? '') : transaction.account.id,
    toAccountId:
      transaction.kind !== 'transfer'
        ? ''
        : isIncomingLeg
          ? transaction.account.id
          : (transaction.transfer?.counterpartAccountId ?? ''),
    categoryId: transaction.category?.id ?? '',
    installments: '1',
  };
}

function TransactionFormDialogContent({
  open,
  onOpenChange,
  transaction,
  defaultKind,
  defaultAccountId,
  accounts,
  categories,
  action,
  onSaved,
  today,
}: TransactionFormDialogProps) {
  const [state, formAction, isPending] = React.useActionState(action, initialTransactionFormState);
  const isEdit = Boolean(transaction);

  const [formKey, setFormKey] = React.useState(0);
  const [lastState, setLastState] = React.useState(state);
  if (state !== lastState) {
    setLastState(state);
    setFormKey((key) => key + 1);
  }

  React.useEffect(() => {
    if (state.status === 'saved') {
      onSaved?.(state.transactionId);
      onOpenChange(false);
    }
    // Só reage à mudança de estado da action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const error = state.status === 'error' ? state : null;
  const values = error?.values ?? valuesFromTransaction(transaction, { defaultKind, defaultAccountId, today });

  return makeResponsiveDialog({
    title: isEdit ? 'Editar lançamento' : 'Novo lançamento',
    open,
    onOpenChange,
    contentProps: { className: 'max-w-[520px]' },
    children: (
      <TransactionFormFields
        key={formKey}
        formAction={formAction}
        values={values}
        fieldErrors={error?.fieldErrors ?? {}}
        message={error?.message}
        accounts={accounts}
        categories={categories}
        today={today}
        isEdit={isEdit}
      />
    ),
    footer: (
      <>
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit" form={FORM_ID} disabled={isPending}>
          {isPending && <Spinner label={null} data-icon="inline-start" />}
          {isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Lançar'}
        </Button>
      </>
    ),
  });
}

function isKind(value: string): value is TransactionKind {
  return (TRANSACTION_KINDS as readonly string[]).includes(value);
}

function TransactionFormFields({
  formAction,
  values,
  fieldErrors,
  message,
  accounts,
  categories,
  today,
  isEdit,
}: {
  isEdit: boolean;
  formAction: (formData: FormData) => void;
  values: TransactionFormValues;
  fieldErrors: Partial<Record<TransactionFieldName, string>>;
  message?: string;
  accounts: AccountOption[];
  categories: CategoryOption[];
  today: string;
}) {
  const [kind, setKind] = React.useState<TransactionKind>(isKind(values.kind) ? values.kind : 'expense');
  const [accountId, setAccountId] = React.useState<string | null>(values.accountId || null);
  const [cleared, setCleared] = React.useState(values.status !== 'planned');
  const [installments, setInstallments] = React.useState(values.installments || '1');
  const selectedAccount = accounts.find((account) => account.id === accountId);
  const canSplit = !isEdit && kind === 'expense' && selectedAccount?.type === 'credit_card';
  const statusId = React.useId();
  const isTransfer = kind === 'transfer';

  return (
    <form id={FORM_ID} action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="status" value={cleared ? 'cleared' : 'planned'} />
      <Tabs.Root value={kind} onValueChange={(next) => isKind(next) && setKind(next)}>
        <Tabs.List aria-label="Tipo do lançamento" className="w-full">
          {TRANSACTION_KINDS.map((option) => (
            <Tabs.Tab key={option} value={option} className="flex-1">
              {TRANSACTION_KIND_LABELS[option]}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={canSplit && installments !== '1' ? 'Valor total' : 'Valor'} error={fieldErrors.amountCents}>
          {(control) => (
            <MoneyInput {...control} name="amountCents" defaultValue={values.amountCents} placeholder="0,00" calculator autoFocus />
          )}
        </Field>
        <Field label="Data" error={fieldErrors.date}>
          {(control) => <DatePicker {...control} name="date" defaultValue={values.date || today} />}
        </Field>
      </div>

      <Field label="Descrição" error={fieldErrors.description}>
        {(control) => (
          <Input
            {...control}
            name="description"
            autoComplete="off"
            placeholder={isTransfer ? 'Ex.: Reserva do mês' : 'Ex.: Supermercado'}
            defaultValue={values.description}
            maxLength={120}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={isTransfer ? 'De' : 'Conta'} error={fieldErrors.accountId}>
          {(control) => (
            <AccountSelect
              {...control}
              name="accountId"
              accounts={accounts}
              value={accountId}
              onValueChange={setAccountId}
            />
          )}
        </Field>
        {isTransfer ? (
          <Field label="Para" error={fieldErrors.toAccountId}>
            {(control) => (
              <AccountSelect
                {...control}
                name="toAccountId"
                accounts={accounts}
                defaultValue={values.toAccountId || null}
                excludeId={accountId}
              />
            )}
          </Field>
        ) : (
          <Field label="Categoria" error={fieldErrors.categoryId}>
            {(control) => (
              <CategorySelect
                // Trocar receita ↔ despesa limpa a categoria, que é de outro tipo.
                key={kind}
                {...control}
                name="categoryId"
                kind={kind}
                categories={categories}
                defaultValue={values.categoryId || null}
              />
            )}
          </Field>
        )}
      </div>

      {canSplit && (
        <Field
          label="Parcelas"
          error={fieldErrors.installments}
          description={installments !== '1' ? 'Cada parcela entra na fatura do seu mês.' : undefined}
        >
          {(control) => (
            <Select.Root value={installments} onValueChange={setInstallments}>
              <Select.Trigger {...control}>
                <Select.Value />
              </Select.Trigger>
              <Select.Content className="max-h-72">
                {Array.from({ length: 24 }, (_, index) => String(index + 1)).map((count) => (
                  <Select.Item key={count} value={count}>
                    {count === '1' ? 'À vista' : `${count}x`}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          )}
        </Field>
      )}
      <input type="hidden" name="installments" value={canSplit ? installments : '1'} />

      <div className="flex items-center justify-between gap-3 rounded-control border border-border-neutral-subtle px-3 py-2">
        <label htmlFor={statusId} className="flex flex-col">
          <Text size="sm" weight="medium">
            {STATUS_LABELS[kind]}
          </Text>
          <Text size="xs" color="secondary">
            {cleared ? 'Entra no saldo da conta.' : 'Fica como previsto, fora do saldo.'}
          </Text>
        </label>
        <Switch id={statusId} checked={cleared} onCheckedChange={setCleared} />
      </div>

      <Field label="Observação" error={fieldErrors.notes}>
        {(control) => (
          <Input {...control} name="notes" autoComplete="off" placeholder="Opcional" defaultValue={values.notes} maxLength={500} />
        )}
      </Field>

      {message && (
        <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
          {message}
        </Panel.Callout>
      )}
    </form>
  );
}
