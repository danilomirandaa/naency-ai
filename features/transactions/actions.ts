'use server';

import { ForbiddenError } from '@/server/auth/errors';
import {
  TransactionError,
  createTransaction,
  deleteTransaction,
  setTransactionStatus,
  updateTransaction,
} from '@/server/dal/transactions';
import { createRecurringRule } from '@/server/dal/recurring';
import { revalidatePath } from 'next/cache';
import {
  type TransactionFormState,
  type TransactionInput,
  parseTransactionForm,
  readTransactionForm,
  recurringFromTransaction,
} from './schemas';

function failure(formData: FormData, error: unknown): TransactionFormState {
  const values = readTransactionForm(formData);
  if (error instanceof TransactionError) {
    return {
      status: 'error',
      message: error.message,
      fieldErrors: error.field ? { [error.field]: error.message } : {},
      values,
    };
  }
  return {
    status: 'error',
    message:
      error instanceof ForbiddenError
        ? 'Seu papel neste espaço não permite lançar.'
        : 'Não foi possível salvar o lançamento. Tente de novo.',
    fieldErrors: {},
    values,
  };
}

export async function createTransactionAction(
  workspaceId: string,
  _previous: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const parsed = parseTransactionForm(formData);
  if (!('success' in parsed)) {
    return parsed;
  }
  // "Recorrente" não cria lançamento: cria a regra que gera os previstos.
  if (formData.get('repeat') === 'recurring') {
    return createRuleFromTransaction(workspaceId, formData, parsed.data);
  }
  try {
    const { id } = await createTransaction(workspaceId, parsed.data);
    // Layout: a sidebar e a página de contas mostram saldos.
    revalidatePath('/', 'layout');
    return { status: 'saved', transactionId: id };
  } catch (error) {
    return failure(formData, error);
  }
}

/**
 * O formulário de lançamento também cria recorrência. Os campos são os mesmos,
 * só mudam a frequência e o fato de a data virar a primeira ocorrência.
 */
async function createRuleFromTransaction(
  workspaceId: string,
  formData: FormData,
  data: TransactionInput,
): Promise<TransactionFormState> {
  const rule = recurringFromTransaction(data, String(formData.get('frequency') ?? ''));
  if (!rule.success) {
    return {
      status: 'error',
      message: rule.message,
      fieldErrors: { [rule.field]: rule.message },
      values: readTransactionForm(formData),
    };
  }
  try {
    await createRecurringRule(workspaceId, rule.data);
  } catch (error) {
    return failure(formData, error);
  }
  revalidatePath('/', 'layout');
  return { status: 'saved', transactionId: null };
}

export async function updateTransactionAction(
  workspaceId: string,
  transactionId: string,
  _previous: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const parsed = parseTransactionForm(formData);
  if (!('success' in parsed)) {
    return parsed;
  }
  try {
    const { id } = await updateTransaction(workspaceId, transactionId, parsed.data);
    revalidatePath('/', 'layout');
    return { status: 'saved', transactionId: id };
  } catch (error) {
    return failure(formData, error);
  }
}

export async function deleteTransactionAction(workspaceId: string, transactionId: string) {
  try {
    await deleteTransaction(workspaceId, transactionId);
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function setTransactionStatusAction(
  workspaceId: string,
  transactionId: string,
  status: 'cleared' | 'planned',
) {
  try {
    await setTransactionStatus(workspaceId, transactionId, status);
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
