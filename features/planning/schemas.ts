import { isIsoDate } from '@/lib/dates';
import { z } from 'zod';

const cents = (message: string) =>
  z.preprocess(
    (value) => (value === '' || value == null ? undefined : Number(value)),
    z.number({ error: message }).int(message).positive(message),
  );

export const budgetInputSchema = z.object({
  categoryId: z.uuid({ error: 'Categoria inválida.' }),
  /** `null` remove o orçamento. */
  amountCents: z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.number().int('Valor inválido.').positive('Informe um valor maior que zero.').nullable(),
  ),
});

export type BudgetInput = z.input<typeof budgetInputSchema>;

export const goalInputSchema = z.object({
  name: z.string({ error: 'Dê um nome à meta.' }).trim().min(1, 'Dê um nome à meta.').max(60),
  targetCents: cents('Informe o valor da meta.'),
  accountId: z.uuid({ error: 'Escolha a conta onde o dinheiro fica.' }),
  targetDate: z
    .preprocess((value) => (value === '' || value === undefined ? null : value), z.string().refine(isIsoDate, 'Data inválida.').nullable())
    .default(null),
});

export type GoalInput = z.input<typeof goalInputSchema>;

export type GoalFormState =
  | { status: 'idle' }
  | { status: 'saved' }
  | {
      status: 'error';
      message: string;
      fieldErrors: Partial<Record<'name' | 'targetCents' | 'accountId' | 'targetDate', string>>;
      values: Record<'name' | 'targetCents' | 'accountId' | 'targetDate', string>;
    };

export const initialGoalFormState: GoalFormState = { status: 'idle' };
