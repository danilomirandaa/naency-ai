'use client';

import { MoneyInput } from '@/components/finance/MoneyInput';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { DialogClose, makeResponsiveDialog } from '@/components/ui/Dialog';
import { Field, type FieldControlProps, Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import {
  type AccountFormState,
  type AccountFormValues,
  initialAccountFormState,
} from '@/features/accounts/schemas';
import type { AccountSummary, InstitutionSummary } from '@/features/accounts/types';
import { ACCOUNT_TYPE_LABELS, CREATABLE_ACCOUNT_TYPES } from '@/lib/accounts';
import * as React from 'react';

export type AccountFormAction = (
  state: AccountFormState,
  formData: FormData,
) => Promise<AccountFormState>;

export type AccountFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Com conta, edita; sem, cria. */
  account?: AccountSummary | null;
  institutions: InstitutionSummary[];
  /** Server Action já ligada ao espaço (e à conta, na edição). */
  action: AccountFormAction;
  onSaved?: (accountId: string) => void;
  /** Data sugerida para o saldo inicial e limite do campo ("AAAA-MM-DD"). */
  today: string;
};

const FORM_ID = 'account-form';
/** O Radix Select não aceita valor vazio num item; "Nenhuma" usa este e vira "" no form. */
const NO_INSTITUTION = 'none';

/** Criar e editar conta usam o mesmo formulário (docs/components.md, regra 3). */
export function AccountFormDialog(props: AccountFormDialogProps) {
  // Nova montagem a cada abertura: o formulário começa limpo.
  const [openCount, setOpenCount] = React.useState(0);
  const [wasOpen, setWasOpen] = React.useState(props.open);
  if (props.open !== wasOpen) {
    setWasOpen(props.open);
    if (props.open) {
      setOpenCount((count) => count + 1);
    }
  }
  return <AccountFormDialogContent key={openCount} {...props} />;
}

function AccountFormDialogContent({
  open,
  onOpenChange,
  account,
  institutions,
  action,
  onSaved,
  today,
}: AccountFormDialogProps) {
  const [state, formAction, isPending] = React.useActionState(action, initialAccountFormState);
  const isEdit = Boolean(account);

  // O React limpa o formulário depois da action, e <select> não reaplica um
  // defaultValue novo. Remontar os campos a cada resposta restaura o que foi digitado.
  const [formKey, setFormKey] = React.useState(0);
  const [lastState, setLastState] = React.useState(state);
  if (state !== lastState) {
    setLastState(state);
    setFormKey((key) => key + 1);
  }

  React.useEffect(() => {
    if (state.status === 'saved') {
      onSaved?.(state.accountId);
      onOpenChange(false);
    }
    // Só reage à mudança de estado da action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const error = state.status === 'error' ? state : null;
  const values: AccountFormValues = error?.values ?? {
    name: account?.name ?? '',
    type: account && account.type !== 'credit_card' ? account.type : '',
    institutionId: account?.institution?.id ?? '',
    initialBalanceCents: account ? account.initialBalanceCents : null,
    initialBalanceDate: account?.initialBalanceDate ?? today,
  };
  const fieldErrors = error?.fieldErrors ?? {};

  return makeResponsiveDialog({
    title: isEdit ? 'Editar conta' : 'Nova conta',
    description: isEdit ? undefined : 'Onde o dinheiro fica: banco, corretora ou carteira.',
    open,
    onOpenChange,
    contentProps: { className: 'max-w-[480px]' },
    children: (
      <form key={formKey} id={FORM_ID} action={formAction} className="flex flex-col gap-4" noValidate>
        <Field label="Nome" error={fieldErrors.name}>
          {(control) => (
            <Input
              {...control}
              name="name"
              autoComplete="off"
              placeholder="Ex.: Nubank, Carteira"
              defaultValue={values.name}
              maxLength={60}
              required
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo" error={fieldErrors.type}>
            {(control) => (
              <Select.Root name="type" defaultValue={values.type || undefined}>
                <Select.Trigger {...control}>
                  <Select.Value placeholder="Escolha…" />
                </Select.Trigger>
                <Select.Content>
                  {CREATABLE_ACCOUNT_TYPES.map((type) => (
                    <Select.Item key={type} value={type}>
                      {ACCOUNT_TYPE_LABELS[type]}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
          </Field>
          <Field label="Instituição" error={fieldErrors.institutionId}>
            {(control) => <InstitutionSelect control={control} institutions={institutions} defaultValue={values.institutionId} />}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Saldo inicial" error={fieldErrors.initialBalanceCents}>
            {(control) => (
              <MoneyInput
                {...control}
                name="initialBalanceCents"
                defaultValue={values.initialBalanceCents}
                allowNegative
                placeholder="0,00"
              />
            )}
          </Field>
          <Field label="Data do saldo" error={fieldErrors.initialBalanceDate}>
            {(control) => (
              <DatePicker
                {...control}
                name="initialBalanceDate"
                defaultValue={values.initialBalanceDate || null}
                max={today}
              />
            )}
          </Field>
        </div>
        <Panel.Callout variant="neutral" icon="info-icon" className="mt-0">
          O saldo da conta parte deste valor, somando os lançamentos a partir da data.
        </Panel.Callout>
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
        <Button type="submit" form={FORM_ID} isLoading={isPending}>
          {isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar conta'}
        </Button>
      </>
    ),
  });
}

function InstitutionSelect({
  control,
  institutions,
  defaultValue,
}: {
  control: FieldControlProps;
  institutions: InstitutionSummary[];
  defaultValue: string;
}) {
  const [institutionId, setInstitutionId] = React.useState(defaultValue);
  return (
    <>
      <Select.Root
        value={institutionId || NO_INSTITUTION}
        onValueChange={(next) => setInstitutionId(next === NO_INSTITUTION ? '' : next)}
      >
        <Select.Trigger {...control}>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value={NO_INSTITUTION}>Nenhuma</Select.Item>
          {institutions.map((institution) => (
            <Select.Item key={institution.id} value={institution.id}>
              {institution.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      <input type="hidden" name="institutionId" value={institutionId} />
    </>
  );
}
