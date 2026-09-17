'use server';

import { ForbiddenError } from '@/server/auth/errors';
import { CardError, payInvoice, unpayInvoice } from '@/server/dal/cards';
import { revalidatePath } from 'next/cache';
import { type PayInvoiceState, payInvoiceSchema } from './schemas';

export async function payInvoiceAction(
  workspaceId: string,
  invoiceId: string,
  _previous: PayInvoiceState,
  formData: FormData,
): Promise<PayInvoiceState> {
  const parsed = payInvoiceSchema.safeParse({
    fromAccountId: formData.get('fromAccountId') ?? undefined,
    date: formData.get('date') ?? undefined,
    amountCents: formData.get('amountCents') ?? undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Extract<PayInvoiceState, { status: 'error' }>['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof typeof fieldErrors;
      fieldErrors[field] ??= issue.message;
    }
    return { status: 'error', message: 'Revise os campos destacados.', fieldErrors };
  }
  try {
    await payInvoice(workspaceId, invoiceId, parsed.data);
  } catch (error) {
    const message =
      error instanceof CardError
        ? error.message
        : error instanceof ForbiddenError
          ? 'Seu papel neste espaço não permite pagar faturas.'
          : 'Não foi possível pagar a fatura. Tente de novo.';
    return { status: 'error', message, fieldErrors: {} };
  }
  revalidatePath('/', 'layout');
  return { status: 'paid' };
}

export async function unpayInvoiceAction(workspaceId: string, invoiceId: string) {
  try {
    await unpayInvoice(workspaceId, invoiceId);
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
