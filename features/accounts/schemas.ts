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
});

export type AccountInput = z.infer<typeof accountInputSchema>;

/** Valores do formulário como digitados, para devolver no erro (o React limpa o form). */
export type AccountFormValues = {
  name: string;
  type: CreatableAccountType | '';
  institutionId: string;
  initialBalanceCents: number | null;
  initialBalanceDate: string;
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
  return {
    name: text(formData, 'name'),
    type: (CREATABLE_ACCOUNT_TYPES as readonly string[]).includes(type)
      ? (type as CreatableAccountType)
      : '',
    institutionId: text(formData, 'institutionId'),
    initialBalanceCents: cents === '' || Number.isNaN(Number(cents)) ? null : Number(cents),
    initialBalanceDate: text(formData, 'initialBalanceDate'),
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
