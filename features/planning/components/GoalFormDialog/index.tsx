'use client';

import { AccountSelect, type AccountOption } from '@/components/finance/AccountSelect';
import { MoneyInput } from '@/components/finance/MoneyInput';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { DialogClose, makeResponsiveDialog } from '@/components/ui/Dialog';
import { Field, Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Spinner } from '@/components/ui/Spinner';
import { type GoalFormState, initialGoalFormState } from '@/features/planning/schemas';
import type { GoalSummary } from '@/features/planning/types';
import * as React from 'react';

export type GoalFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: GoalSummary | null;
  accounts: AccountOption[];
  action: (state: GoalFormState, formData: FormData) => Promise<GoalFormState>;
  onSaved?: () => void;
};

export function GoalFormDialog(props: GoalFormDialogProps) {
  const [openCount, setOpenCount] = React.useState(0);
  const [wasOpen, setWasOpen] = React.useState(props.open);
  if (props.open !== wasOpen) {
    setWasOpen(props.open);
    if (props.open) {
      setOpenCount((count) => count + 1);
    }
  }
  return <GoalFormDialogContent key={openCount} {...props} />;
}

function GoalFormDialogContent({ open, onOpenChange, goal, accounts, action, onSaved }: GoalFormDialogProps) {
  const [state, formAction, isPending] = React.useActionState(action, initialGoalFormState);
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
  const values = error?.values ?? {
    name: goal?.name ?? '',
    targetCents: goal ? String(goal.targetCents) : '',
    accountId: goal?.account.id ?? '',
    targetDate: goal?.targetDate ?? '',
  };
  const fieldErrors = error?.fieldErrors ?? {};

  return makeResponsiveDialog({
    title: goal ? 'Editar meta' : 'Nova meta',
    open,
    onOpenChange,
    contentProps: { className: 'max-w-[480px]' },
    children: (
      <form key={formKey} id="goal-form" action={formAction} className="flex flex-col gap-4" noValidate>
        <Field label="Nome" error={fieldErrors.name}>
          {(control) => <Input {...control} name="name" placeholder="Ex.: Reserva de emergência" defaultValue={values.name} maxLength={60} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor da meta" error={fieldErrors.targetCents}>
            {(control) => (
              <MoneyInput {...control} name="targetCents" defaultValue={values.targetCents ? Number(values.targetCents) : null} placeholder="0,00" />
            )}
          </Field>
          <Field label="Até" description="Opcional." error={fieldErrors.targetDate}>
            {(control) => <DatePicker {...control} name="targetDate" defaultValue={values.targetDate || null} placeholder="Sem data" />}
          </Field>
        </div>
        <Field label="Conta onde o dinheiro fica" error={fieldErrors.accountId}>
          {(control) => (
            <AccountSelect
              {...control}
              name="accountId"
              accounts={accounts.filter((account) => account.type !== 'credit_card')}
              defaultValue={values.accountId || null}
            />
          )}
        </Field>
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
        <Button type="submit" form="goal-form" disabled={isPending}>
          {isPending && <Spinner label={null} data-icon="inline-start" />}
          {goal ? 'Salvar alterações' : 'Criar meta'}
        </Button>
      </>
    ),
  });
}
