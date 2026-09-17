'use server';

import { AccountError, createAccount, setAccountArchived, updateAccount } from '@/server/dal/accounts';
import { ForbiddenError } from '@/server/auth/errors';
import { revalidatePath } from 'next/cache';
import { type AccountFormState, parseAccountForm, readAccountForm } from './schemas';

function failure(formData: FormData, error: unknown): AccountFormState {
  const message =
    error instanceof ForbiddenError
      ? 'Seu papel neste espaço não permite editar contas.'
      : error instanceof AccountError
        ? error.message
        : 'Não foi possível salvar a conta. Tente de novo.';
  return { status: 'error', message, fieldErrors: {}, values: readAccountForm(formData) };
}

export async function createAccountAction(
  workspaceId: string,
  _previous: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const parsed = parseAccountForm(formData);
  if (!('success' in parsed)) {
    return parsed;
  }
  try {
    const { id } = await createAccount(workspaceId, parsed.data);
    // Layout inteiro: a sidebar também lista as contas.
    revalidatePath('/', 'layout');
    return { status: 'saved', accountId: id };
  } catch (error) {
    return failure(formData, error);
  }
}

export async function updateAccountAction(
  workspaceId: string,
  accountId: string,
  _previous: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const parsed = parseAccountForm(formData);
  if (!('success' in parsed)) {
    return parsed;
  }
  try {
    await updateAccount(workspaceId, accountId, parsed.data);
    revalidatePath('/', 'layout');
    return { status: 'saved', accountId };
  } catch (error) {
    return failure(formData, error);
  }
}

export async function setAccountArchivedAction(
  workspaceId: string,
  accountId: string,
  archived: boolean,
): Promise<{ ok: boolean }> {
  try {
    await setAccountArchived(workspaceId, accountId, archived);
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
