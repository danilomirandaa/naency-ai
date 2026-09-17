import { isIsoDate } from '@/lib/dates';
import { z } from 'zod';

export const payInvoiceSchema = z.object({
  fromAccountId: z.uuid({ error: 'Escolha a conta que paga a fatura.' }),
  date: z.string({ error: 'Informe a data do pagamento.' }).refine(isIsoDate, 'Informe a data do pagamento.'),
  amountCents: z.preprocess(
    (value) => (value === '' || value == null ? undefined : Number(value)),
    z.number({ error: 'Informe o valor pago.' }).int('Valor inválido.').positive('Informe o valor pago.'),
  ),
});

export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>;

export type PayInvoiceState =
  | { status: 'idle' }
  | { status: 'paid' }
  | {
      status: 'error';
      message: string;
      fieldErrors: Partial<Record<keyof PayInvoiceInput, string>>;
    };

export const initialPayInvoiceState: PayInvoiceState = { status: 'idle' };
