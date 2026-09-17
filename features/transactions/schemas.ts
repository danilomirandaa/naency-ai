import { isIsoDate } from '@/lib/dates';
import { TRANSACTION_STATUSES } from '@/lib/transactions';
import { z } from 'zod';

const MAX_CENTS = 10_000_000_000_000;

const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value);

const common = {
  amountCents: z.preprocess(
    (value) => (value === '' || value == null ? undefined : Number(value)),
    z
      .number({ error: 'Informe o valor.' })
      .int('Valor inválido.')
      .positive('Informe um valor maior que zero.')
      .max(MAX_CENTS, 'Valor alto demais.'),
  ),
  date: z.string({ error: 'Informe a data.' }).refine(isIsoDate, 'Informe a data.'),
  description: z
    .string({ error: 'Descreva o lançamento.' })
    .trim()
    .min(1, 'Descreva o lançamento.')
    .max(120, 'Use no máximo 120 caracteres.'),
  status: z.enum(TRANSACTION_STATUSES).default('cleared'),
  notes: z.preprocess(
    emptyToNull,
    z.string().trim().max(500, 'Use no máximo 500 caracteres.').nullable(),
  ),
  accountId: z.uuid({ error: 'Escolha a conta.' }),
};

export const transactionInputSchema = z.discriminatedUnion(
  'kind',
  [
    z.object({
      kind: z.enum(['expense', 'income']),
      ...common,
      categoryId: z.preprocess(emptyToNull, z.uuid({ error: 'Categoria inválida.' }).nullable()),
    }),
    z
      .object({
        kind: z.literal('transfer'),
        ...common,
        toAccountId: z.uuid({ error: 'Escolha a conta de destino.' }),
      })
      .refine((value) => value.accountId !== value.toAccountId, {
        path: ['toAccountId'],
        message: 'Escolha uma conta diferente da de origem.',
      }),
  ],
  { error: 'Escolha o tipo do lançamento.' },
);

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export type TransactionFormValues = {
  kind: string;
  amountCents: number | null;
  date: string;
  description: string;
  status: string;
  notes: string;
  accountId: string;
  toAccountId: string;
  categoryId: string;
};

export type TransactionFieldName = keyof TransactionFormValues;

export type TransactionFormState =
  | { status: 'idle' }
  | { status: 'saved'; transactionId: string }
  | {
      status: 'error';
      message: string;
      fieldErrors: Partial<Record<TransactionFieldName, string>>;
      values: TransactionFormValues;
    };

export const initialTransactionFormState: TransactionFormState = { status: 'idle' };

const FIELDS: TransactionFieldName[] = [
  'kind',
  'amountCents',
  'date',
  'description',
  'status',
  'notes',
  'accountId',
  'toAccountId',
  'categoryId',
];

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export function readTransactionForm(formData: FormData): TransactionFormValues {
  const cents = text(formData, 'amountCents');
  return {
    kind: text(formData, 'kind'),
    amountCents: cents === '' || Number.isNaN(Number(cents)) ? null : Number(cents),
    date: text(formData, 'date'),
    description: text(formData, 'description'),
    status: text(formData, 'status'),
    notes: text(formData, 'notes'),
    accountId: text(formData, 'accountId'),
    toAccountId: text(formData, 'toAccountId'),
    categoryId: text(formData, 'categoryId'),
  };
}

export function parseTransactionForm(
  formData: FormData,
): { success: true; data: TransactionInput } | Extract<TransactionFormState, { status: 'error' }> {
  const raw = Object.fromEntries(
    FIELDS.flatMap((field) => {
      const value = formData.get(field);
      return value === null ? [] : [[field, value]];
    }),
  );
  if (raw.status === '') {
    delete raw.status;
  }
  const parsed = transactionInputSchema.safeParse(raw);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  const fieldErrors: Partial<Record<TransactionFieldName, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = (issue.path[0] ?? 'kind') as TransactionFieldName;
    fieldErrors[field] ??= issue.message;
  }
  return {
    status: 'error',
    message: 'Revise os campos destacados.',
    fieldErrors,
    values: readTransactionForm(formData),
  };
}
