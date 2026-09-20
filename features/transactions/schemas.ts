import { isIsoDate } from '@/lib/dates';
import { RECURRENCE_FREQUENCIES, type RecurrenceFrequency } from '@/lib/recurrence';
import { PAYMENT_METHODS, TRANSACTION_STATUSES } from '@/lib/transactions';
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
  paymentMethod: z.preprocess(emptyToNull, z.enum(PAYMENT_METHODS, { error: 'Forma de pagamento inválida.' }).nullable()).default(null),
  /** Só vale em efetivados; vazio usa a data do lançamento. */
  paidAt: z.preprocess(emptyToNull, z.string().refine(isIsoDate, 'Data de pagamento inválida.').nullable()).default(null),
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
      /** Parcelas (só despesa em cartão de crédito). O valor é o total da compra. */
      installments: z
        .preprocess(
          (value) => (value === '' || value == null ? 1 : Number(value)),
          z.number().int('Parcelas inválidas.').min(1, 'Parcelas inválidas.').max(48, 'No máximo 48 parcelas.'),
        )
        .default(1),
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
export type TransactionInputRaw = z.input<typeof transactionInputSchema>;

export type TransactionFormValues = {
  kind: string;
  amountCents: number | null;
  date: string;
  description: string;
  status: string;
  paymentMethod: string;
  paidAt: string;
  notes: string;
  accountId: string;
  toAccountId: string;
  categoryId: string;
  installments: string;
  repeat: string;
  frequency: string;
};

export type TransactionFieldName = keyof TransactionFormValues;

/**
 * Como o lançamento se repete. `installments` e `recurring` mudam o que é
 * criado: parcelas viram N lançamentos, e recorrente vira uma regra que gera os
 * previstos (docs/domain.md).
 */
export const TRANSACTION_REPEATS = ['once', 'installments', 'recurring'] as const;
export type TransactionRepeat = (typeof TRANSACTION_REPEATS)[number];

export function isTransactionRepeat(value: string): value is TransactionRepeat {
  return (TRANSACTION_REPEATS as readonly string[]).includes(value);
}

export type TransactionFormState =
  | { status: 'idle' }
  // Recorrente não cria lançamento, cria regra: por isso o id é opcional.
  | { status: 'saved'; transactionId: string | null }
  | {
      status: 'error';
      message: string;
      fieldErrors: Partial<Record<TransactionFieldName, string>>;
      values: TransactionFormValues;
    };

export const initialTransactionFormState: TransactionFormState = { status: 'idle' };

export type RecurringFromTransaction = {
  kind: 'expense' | 'income';
  description: string;
  amountCents: number;
  accountId: string;
  categoryId: string | null;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: null;
};

/**
 * Converte o lançamento do formulário na regra de recorrência: os campos são os
 * mesmos, e a data do lançamento vira a primeira ocorrência. Transferência não
 * vira regra — a recorrência é de receita ou despesa (docs/domain.md).
 */
export function recurringFromTransaction(
  data: TransactionInput,
  frequency: string,
): { success: true; data: RecurringFromTransaction } | { success: false; field: TransactionFieldName; message: string } {
  if (data.kind === 'transfer') {
    return { success: false, field: 'repeat', message: 'Transferência não pode ser recorrente.' };
  }
  if (!(RECURRENCE_FREQUENCIES as readonly string[]).includes(frequency)) {
    return { success: false, field: 'frequency', message: 'Escolha a frequência.' };
  }
  return {
    success: true,
    data: {
      kind: data.kind,
      description: data.description,
      amountCents: data.amountCents,
      accountId: data.accountId,
      categoryId: data.categoryId,
      frequency: frequency as RecurrenceFrequency,
      startDate: data.date,
      endDate: null,
    },
  };
}

const FIELDS: TransactionFieldName[] = [
  'kind',
  'amountCents',
  'date',
  'description',
  'status',
  'paymentMethod',
  'paidAt',
  'notes',
  'accountId',
  'toAccountId',
  'categoryId',
  'installments',
  'repeat',
  'frequency',
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
    paymentMethod: text(formData, 'paymentMethod'),
    paidAt: text(formData, 'paidAt'),
    notes: text(formData, 'notes'),
    accountId: text(formData, 'accountId'),
    toAccountId: text(formData, 'toAccountId'),
    categoryId: text(formData, 'categoryId'),
    installments: text(formData, 'installments'),
    repeat: text(formData, 'repeat'),
    frequency: text(formData, 'frequency'),
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
