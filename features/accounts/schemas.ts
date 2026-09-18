import { CREATABLE_ACCOUNT_TYPES, type CreatableAccountType } from '@/lib/accounts';
import { isIsoDate } from '@/lib/dates';
import { z } from 'zod';

/** R$ 100 bilhões: acima disso é erro de digitação. */
const MAX_BALANCE_CENTS = 10_000_000_000_000;

const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value);

export const accountInputSchema = z.object({
  name: z
    .string({ error: 'Dê um nome à conta.' })
    .trim()
    .min(1, 'Dê um nome à conta.')
    .max(60, 'Use no máximo 60 caracteres.'),
  type: z.enum(CREATABLE_ACCOUNT_TYPES, { error: 'Escolha o tipo da conta.' }),
  institutionId: z.preprocess(emptyToNull, z.uuid({ error: 'Instituição inválida.' }).nullable()),
  initialBalanceCents: z.preprocess(
    (value) => (value === '' || value == null ? 0 : Number(value)),
    z
      .number({ error: 'Saldo inválido.' })
      .int('Saldo inválido.')
      .refine((cents) => Math.abs(cents) <= MAX_BALANCE_CENTS, 'Saldo alto demais.'),
  ),
  initialBalanceDate: z
    .string({ error: 'Informe a data do saldo.' })
    .refine(isIsoDate, 'Informe a data do saldo.'),
  // Só para cartão de crédito.
  closingDay: z.preprocess(emptyToNull, z.coerce.number().int().min(1).max(31).nullable()).default(null),
  dueDay: z.preprocess(emptyToNull, z.coerce.number().int().min(1).max(31).nullable()).default(null),
  limitCents: z
    .preprocess(
      emptyToNull,
      z.coerce.number().int('Limite inválido.').min(0, 'Limite inválido.').max(MAX_BALANCE_CENTS, 'Limite alto demais.').nullable(),
    )
    .default(null),
  defaultPaymentAccountId: z
    .preprocess(emptyToNull, z.uuid({ error: 'Conta de pagamento inválida.' }).nullable())
    .default(null),
}).superRefine((value, ctx) => {
  if (value.type !== 'credit_card') {
    return;
  }
  if (value.closingDay === null) {
    ctx.addIssue({ code: 'custom', path: ['closingDay'], message: 'Informe o dia de fechamento (1 a 31).' });
  }
  if (value.dueDay === null) {
    ctx.addIssue({ code: 'custom', path: ['dueDay'], message: 'Informe o dia de vencimento (1 a 31).' });
  }
}).transform((value) =>
  // No cartão o campo é "dívida": o usuário digita positivo e o saldo é negativo.
  value.type === 'credit_card'
    ? { ...value, initialBalanceCents: value.initialBalanceCents === 0 ? 0 : -Math.abs(value.initialBalanceCents) }
    : value,
);

export type AccountInput = z.infer<typeof accountInputSchema>;
/** Entrada aceita pelo DAL (campos de cartão opcionais). */
export type AccountInputRaw = z.input<typeof accountInputSchema>;

/** Valores do formulário como digitados, para devolver no erro (o React limpa o form). */
export type AccountFormValues = {
  name: string;
  type: CreatableAccountType | '';
  institutionId: string;
  initialBalanceCents: number | null;
  initialBalanceDate: string;
  closingDay: string;
  dueDay: string;
  limitCents: number | null;
  defaultPaymentAccountId: string;
};

export type AccountFormState =
  | { status: 'idle' }
  | { status: 'saved'; accountId: string }
  | {
      status: 'error';
      message: string;
      fieldErrors: Partial<Record<keyof AccountInput, string>>;
      values: AccountFormValues;
    };

export const initialAccountFormState: AccountFormState = { status: 'idle' };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export function readAccountForm(formData: FormData): AccountFormValues {
  const type = text(formData, 'type');
  const cents = text(formData, 'initialBalanceCents');
  const limit = text(formData, 'limitCents');
  return {
    name: text(formData, 'name'),
    type: (CREATABLE_ACCOUNT_TYPES as readonly string[]).includes(type)
      ? (type as CreatableAccountType)
      : '',
    institutionId: text(formData, 'institutionId'),
    initialBalanceCents: cents === '' || Number.isNaN(Number(cents)) ? null : Number(cents),
    initialBalanceDate: text(formData, 'initialBalanceDate'),
    closingDay: text(formData, 'closingDay'),
    dueDay: text(formData, 'dueDay'),
    limitCents: limit === '' || Number.isNaN(Number(limit)) ? null : Number(limit),
    defaultPaymentAccountId: text(formData, 'defaultPaymentAccountId'),
  };
}

/** Valida o formulário; em erro, devolve a mensagem de cada campo e o que foi digitado. */
export function parseAccountForm(
  formData: FormData,
): { success: true; data: AccountInput } | Extract<AccountFormState, { status: 'error' }> {
  const values = readAccountForm(formData);
  const parsed = accountInputSchema.safeParse({
    name: formData.get('name') ?? undefined,
    type: formData.get('type') ?? undefined,
    institutionId: formData.get('institutionId') ?? undefined,
    initialBalanceCents: formData.get('initialBalanceCents') ?? undefined,
    initialBalanceDate: formData.get('initialBalanceDate') ?? undefined,
    closingDay: formData.get('closingDay') ?? undefined,
    dueDay: formData.get('dueDay') ?? undefined,
    limitCents: formData.get('limitCents') ?? undefined,
    defaultPaymentAccountId: formData.get('defaultPaymentAccountId') ?? undefined,
  });
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  const fieldErrors: Partial<Record<keyof AccountInput, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as keyof AccountInput;
    fieldErrors[field] ??= issue.message;
  }
  return { status: 'error', message: 'Revise os campos destacados.', fieldErrors, values };
}
