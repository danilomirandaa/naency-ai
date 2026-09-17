import { isIsoDate } from '@/lib/dates';
import { RECURRENCE_FREQUENCIES } from '@/lib/recurrence';
import { z } from 'zod';

const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value);

export const recurringRuleInputSchema = z
  .object({
    kind: z.enum(['income', 'expense'], { error: 'Escolha receita ou despesa.' }),
    description: z.string({ error: 'Descreva a recorrência.' }).trim().min(1, 'Descreva a recorrência.').max(120),
    amountCents: z.preprocess(
      (value) => (value === '' || value == null ? undefined : Number(value)),
      z.number({ error: 'Informe o valor.' }).int('Valor inválido.').positive('Informe um valor maior que zero.'),
    ),
    accountId: z.uuid({ error: 'Escolha a conta.' }),
    categoryId: z.preprocess(emptyToNull, z.uuid({ error: 'Categoria inválida.' }).nullable()).default(null),
    frequency: z.enum(RECURRENCE_FREQUENCIES, { error: 'Escolha a frequência.' }),
    startDate: z.string({ error: 'Informe a primeira data.' }).refine(isIsoDate, 'Informe a primeira data.'),
    endDate: z.preprocess(emptyToNull, z.string().refine(isIsoDate, 'Data final inválida.').nullable()).default(null),
  })
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    path: ['endDate'],
    message: 'A data final precisa ser depois da primeira.',
  });

export type RecurringRuleInput = z.input<typeof recurringRuleInputSchema>;

export type RecurringFormValues = Record<
  'kind' | 'description' | 'amountCents' | 'accountId' | 'categoryId' | 'frequency' | 'startDate' | 'endDate',
  string
>;

export type RecurringFormState =
  | { status: 'idle' }
  | { status: 'saved' }
  | {
      status: 'error';
      message: string;
      fieldErrors: Partial<Record<keyof RecurringFormValues, string>>;
      values: RecurringFormValues;
    };

export const initialRecurringFormState: RecurringFormState = { status: 'idle' };

const FIELDS = ['kind', 'description', 'amountCents', 'accountId', 'categoryId', 'frequency', 'startDate', 'endDate'] as const;

export function readRecurringForm(formData: FormData): RecurringFormValues {
  return Object.fromEntries(
    FIELDS.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === 'string' ? value : ''];
    }),
  ) as RecurringFormValues;
}

export function parseRecurringForm(formData: FormData) {
  const values = readRecurringForm(formData);
  const parsed = recurringRuleInputSchema.safeParse(values);
  if (parsed.success) {
    return { success: true as const, data: parsed.data };
  }
  const fieldErrors: Partial<Record<keyof RecurringFormValues, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as keyof RecurringFormValues;
    fieldErrors[field] ??= issue.message;
  }
  return { status: 'error' as const, message: 'Revise os campos destacados.', fieldErrors, values };
}
