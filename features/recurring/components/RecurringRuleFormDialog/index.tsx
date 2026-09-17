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
import { Tabs } from '@/components/ui/Tabs';
import {
  type RecurringFormState,
  type RecurringFormValues,
  initialRecurringFormState,
} from '@/features/recurring/schemas';
import type { RecurringRuleSummary } from '@/features/recurring/types';
import { RECURRENCE_FREQUENCIES, RECURRENCE_FREQUENCY_LABELS } from '@/lib/recurrence';
import * as React from 'react';

export type RecurringRuleFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: RecurringRuleSummary | null;
  accounts: AccountOption[];
  categories: CategoryOption[];
  action: (state: RecurringFormState, formData: FormData) => Promise<RecurringFormState>;
  onSaved?: () => void;
  today: string;
};

const FORM_ID = 'recurring-form';

export function RecurringRuleFormDialog(props: RecurringRuleFormDialogProps) {
  const [openCount, setOpenCount] = React.useState(0);
  const [wasOpen, setWasOpen] = React.useState(props.open);
  if (props.open !== wasOpen) {
    setWasOpen(props.open);
    if (props.open) {
      setOpenCount((count) => count + 1);
    }
  }
  return <RecurringRuleFormDialogContent key={openCount} {...props} />;
}

function RecurringRuleFormDialogContent({
  open,
  onOpenChange,
  rule,
  accounts,
  categories,
  action,
  onSaved,
  today,
}: RecurringRuleFormDialogProps) {
  const [state, formAction, isPending] = React.useActionState(action, initialRecurringFormState);
  const [formKey, setFormKey] = React.useState(0);
  const [lastState, setLastState] = React.useState(state);
  if (state !== lastState) {
    setLastState(state);
    setFormKey((key) => key + 1);
  }
  React.useEffect(() => {
    if (state.status === 'saved') {
      onSaved?.();
      onOpenChange(false);
    }
    // Só reage à mudança de estado da action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const error = state.status === 'error' ? state : null;
  const values: RecurringFormValues = error?.values ?? {
    kind: rule?.kind ?? 'expense',
    description: rule?.description ?? '',
    amountCents: rule ? String(rule.amountCents) : '',
    accountId: rule?.account.id ?? '',
    categoryId: rule?.category?.id ?? '',
    frequency: rule?.frequency ?? 'monthly',
    startDate: rule?.startDate ?? today,
    endDate: rule?.endDate ?? '',
  };

  return makeResponsiveDialog({
    title: rule ? 'Editar recorrência' : 'Nova recorrência',
    description: 'Gera lançamentos previstos para os próximos 45 dias.',
    open,
    onOpenChange,
    contentProps: { className: 'max-w-[520px]' },
    children: (
      <RecurringFields
        key={formKey}
        formAction={formAction}
        values={values}
        fieldErrors={error?.fieldErrors ?? {}}
        message={error?.message}
        accounts={accounts}
        categories={categories}
      />
    ),
    footer: (
      <>
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit" form={FORM_ID} disabled={isPending}>
          {isPending && <Spinner label={null} data-icon="inline-start" />}
          {isPending ? 'Salvando…' : rule ? 'Salvar alterações' : 'Criar recorrência'}
        </Button>
      </>
    ),
  });
}

function RecurringFields({
  formAction,
  values,
  fieldErrors,
  message,
  accounts,
  categories,
}: {
  formAction: (formData: FormData) => void;
  values: RecurringFormValues;
  fieldErrors: Partial<Record<keyof RecurringFormValues, string>>;
  message?: string;
  accounts: AccountOption[];
  categories: CategoryOption[];
}) {
  const [kind, setKind] = React.useState<'income' | 'expense'>(values.kind === 'income' ? 'income' : 'expense');
  const [frequency, setFrequency] = React.useState(values.frequency || 'monthly');
  return (
    <form id={FORM_ID} action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="frequency" value={frequency} />
      <Tabs.Root value={kind} onValueChange={(next) => setKind(next === 'income' ? 'income' : 'expense')}>
        <Tabs.List aria-label="Tipo">
          <Tabs.Tab value="expense">Despesa</Tabs.Tab>
          <Tabs.Tab value="income">Receita</Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>
      <Field label="Descrição" error={fieldErrors.description}>
        {(control) => (
          <Input {...control} name="description" autoComplete="off" placeholder="Ex.: Aluguel" defaultValue={values.description} maxLength={120} />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Valor" error={fieldErrors.amountCents}>
          {(control) => (
            <MoneyInput {...control} name="amountCents" defaultValue={values.amountCents ? Number(values.amountCents) : null} placeholder="0,00" calculator />
          )}
        </Field>
        <Field label="Frequência" error={fieldErrors.frequency}>
          {(control) => (
            <Select.Root value={frequency} onValueChange={setFrequency}>
              <Select.Trigger {...control}>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {RECURRENCE_FREQUENCIES.map((option) => (
                  <Select.Item key={option} value={option}>
                    {RECURRENCE_FREQUENCY_LABELS[option]}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          )}
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Conta" error={fieldErrors.accountId}>
          {(control) => <AccountSelect {...control} name="accountId" accounts={accounts} defaultValue={values.accountId || null} />}
        </Field>
        <Field label="Categoria" error={fieldErrors.categoryId}>
          {(control) => (
            <CategorySelect key={kind} {...control} name="categoryId" kind={kind} categories={categories} defaultValue={values.categoryId || null} />
          )}
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primeira data" error={fieldErrors.startDate}>
          {(control) => <DatePicker {...control} name="startDate" defaultValue={values.startDate || null} />}
        </Field>
        <Field label="Até" description="Opcional." error={fieldErrors.endDate}>
          {(control) => <DatePicker {...control} name="endDate" defaultValue={values.endDate || null} placeholder="Sem fim" />}
        </Field>
      </div>
      {message && (
        <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
          {message}
        </Panel.Callout>
      )}
    </form>
  );
}
