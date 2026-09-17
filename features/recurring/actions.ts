'use server';

import { ForbiddenError } from '@/server/auth/errors';
import {
  RecurringError,
  createRecurringRule,
  deleteRecurringRule,
  setRecurringRuleActive,
  updateRecurringRule,
} from '@/server/dal/recurring';
import { revalidatePath } from 'next/cache';
import { type RecurringFormState, parseRecurringForm, readRecurringForm } from './schemas';

function failure(formData: FormData, error: unknown): RecurringFormState {
  const message =
    error instanceof RecurringError
      ? error.message
      : error instanceof ForbiddenError
        ? 'Seu papel neste espaço não permite editar recorrências.'
        : 'Não foi possível salvar a recorrência. Tente de novo.';
  return { status: 'error', message, fieldErrors: {}, values: readRecurringForm(formData) };
}

export async function saveRecurringRuleAction(
  workspaceId: string,
  ruleId: string | null,
  _previous: RecurringFormState,
  formData: FormData,
): Promise<RecurringFormState> {
  const parsed = parseRecurringForm(formData);
  if (!parsed.success) {
    return parsed;
  }
  try {
    if (ruleId) {
      await updateRecurringRule(workspaceId, ruleId, parsed.data);
    } else {
      await createRecurringRule(workspaceId, parsed.data);
    }
  } catch (error) {
    return failure(formData, error);
  }
  revalidatePath('/', 'layout');
  return { status: 'saved' };
}

export async function setRecurringRuleActiveAction(workspaceId: string, ruleId: string, active: boolean) {
  try {
    await setRecurringRuleActive(workspaceId, ruleId, active);
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function deleteRecurringRuleAction(workspaceId: string, ruleId: string) {
  try {
    await deleteRecurringRule(workspaceId, ruleId);
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
