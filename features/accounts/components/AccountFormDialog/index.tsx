'use client';

import { MoneyInput } from '@/components/finance/MoneyInput';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { AccountSelect, type AccountOption } from '@/components/finance/AccountSelect';
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
import { ACCOUNT_TYPE_LABELS, type AccountType, CREATABLE_ACCOUNT_TYPES } from '@/lib/accounts';
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
  /** Tipo sugerido ao criar (ex.: "Novo cartão"). */
  defaultType?: AccountType;
  /** Contas que podem pagar a fatura de um cartão. */
  paymentAccounts?: AccountOption[];
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
  defaultType,
  paymentAccounts = [],
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
    type: account?.type ?? defaultType ?? '',
    institutionId: account?.institution?.id ?? '',
    initialBalanceCents: account ? account.initialBalanceCents : null,
    initialBalanceDate: account?.initialBalanceDate ?? today,
    closingDay: account?.card ? String(account.card.closingDay) : '',
    dueDay: account?.card ? String(account.card.dueDay) : '',
    limitCents: account?.card?.limitCents ?? null,
    defaultPaymentAccountId: account?.card?.defaultPaymentAccountId ?? '',
  };
  const fieldErrors = error?.fieldErrors ?? {};

  return makeResponsiveDialog({
    title: isEdit ? 'Editar conta' : values.type === 'credit_card' ? 'Novo cartão' : 'Nova conta',
    description: isEdit ? undefined : 'Onde o dinheiro fica: banco, cartão, corretora ou carteira.',
    open,
    onOpenChange,
    contentProps: { className: 'max-w-[480px]' },
    children: (
      <AccountFormFields
        key={formKey}
        formAction={formAction}
        values={values}
        fieldErrors={fieldErrors}
        message={error?.message}
        institutions={institutions}
        paymentAccounts={paymentAccounts.filter((item) => item.id !== account?.id)}
        today={today}
        lockedType={account ? (account.type === 'credit_card' ? 'card' : 'not-card') : null}
      />
    ),
    footer: (
      <>
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit" form={FORM_ID} disabled={isPending}>
          {isPending && <Spinner label={null} data-icon="inline-start" />}
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

const DAYS = Array.from({ length: 31 }, (_, index) => String(index + 1));

function DaySelect({
  control,
  name,
  defaultValue,
}: {
  control: FieldControlProps;
  name: string;
  defaultValue: string;
}) {
  return (
    <Select.Root name={name} defaultValue={defaultValue || undefined}>
      <Select.Trigger {...control}>
        <Select.Value placeholder="Dia" />
      </Select.Trigger>
      <Select.Content className="max-h-64">
        {DAYS.map((day) => (
          <Select.Item key={day} value={day}>
            Dia {day}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

function AccountFormFields({
  formAction,
  values,
  fieldErrors,
  message,
  institutions,
  paymentAccounts,
  today,
  lockedType,
}: {
  formAction: (formData: FormData) => void;
  values: AccountFormValues;
  fieldErrors: Partial<Record<string, string>>;
  message?: string;
  institutions: InstitutionSummary[];
  paymentAccounts: AccountOption[];
  today: string;
  /** Na edição, cartão não vira conta comum nem o contrário. */
  lockedType: 'card' | 'not-card' | null;
}) {
  const [type, setType] = React.useState<string>(values.type);
  const isCard = type === 'credit_card';
  const typeOptions = CREATABLE_ACCOUNT_TYPES.filter((option) =>
    lockedType === 'not-card' ? option !== 'credit_card' : lockedType === 'card' ? option === 'credit_card' : true,
  );

  return (
    <form id={FORM_ID} action={formAction} className="flex flex-col gap-4" noValidate>
      <Field label="Nome" error={fieldErrors.name}>
        {(control) => (
          <Input
            {...control}
            name="name"
            autoComplete="off"
            placeholder={isCard ? 'Ex.: Nubank Roxinho' : 'Ex.: Nubank, Carteira'}
            defaultValue={values.name}
            maxLength={60}
            required
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo" error={fieldErrors.type}>
          {(control) => (
            <Select.Root name="type" value={type || undefined} onValueChange={setType} disabled={lockedType === 'card'}>
              <Select.Trigger {...control}>
                <Select.Value placeholder="Escolha…" />
              </Select.Trigger>
              <Select.Content>
                {typeOptions.map((option) => (
                  <Select.Item key={option} value={option}>
                    {ACCOUNT_TYPE_LABELS[option]}
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
      {/* Tipo desabilitado não entra no FormData. */}
      {lockedType === 'card' && <input type="hidden" name="type" value="credit_card" />}
      {isCard ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fechamento" error={fieldErrors.closingDay}>
              {(control) => <DaySelect control={control} name="closingDay" defaultValue={values.closingDay} />}
            </Field>
            <Field label="Vencimento" error={fieldErrors.dueDay}>
              {(control) => <DaySelect control={control} name="dueDay" defaultValue={values.dueDay} />}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Limite" description="Opcional." error={fieldErrors.limitCents}>
              {(control) => (
                <MoneyInput {...control} name="limitCents" defaultValue={values.limitCents} placeholder="0,00" />
              )}
            </Field>
            <Field label="Pagar a fatura com" error={fieldErrors.defaultPaymentAccountId}>
              {(control) => (
                <AccountSelect
                  {...control}
                  name="defaultPaymentAccountId"
                  accounts={paymentAccounts.filter((item) => item.type !== 'credit_card')}
                  allLabel="Escolher na hora"
                  defaultValue={values.defaultPaymentAccountId || null}
                />
              )}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Dívida no fim do dia"
              description="Quanto já está usado do limite nessa data."
              error={fieldErrors.initialBalanceCents}
            >
              {(control) => (
                <MoneyInput
                  {...control}
                  name="initialBalanceCents"
                  defaultValue={values.initialBalanceCents === null ? null : Math.abs(values.initialBalanceCents)}
                  placeholder="0,00"
                />
              )}
            </Field>
            <Field label="Na data" error={fieldErrors.initialBalanceDate}>
              {(control) => (
                <DatePicker {...control} name="initialBalanceDate" defaultValue={values.initialBalanceDate || null} max={today} />
              )}
            </Field>
          </div>
          <Panel.Callout variant="neutral" icon="info-icon" className="mt-0">
            Compras até o dia do fechamento entram na fatura que vence no mês; depois, na seguinte. Deixe a dívida
            zerada se você for importar todas as faturas em aberto.
          </Panel.Callout>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Saldo no fim do dia"
              description="O que o banco mostra nessa data."
              error={fieldErrors.initialBalanceCents}
            >
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
            O saldo parte desse valor e soma o que vier <strong>depois</strong> dessa data. Os lançamentos do próprio
            dia já estão nele, então importar o extrato do dia não soma duas vezes.
          </Panel.Callout>
        </>
      )}
      {message && (
        <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
          {message}
        </Panel.Callout>
      )}
    </form>
  );
}
