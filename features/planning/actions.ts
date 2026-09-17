'use server';

import { ForbiddenError } from '@/server/auth/errors';
import { PlanningError, createGoal, deleteGoal, setBudget, updateGoal } from '@/server/dal/planning';
import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { type GoalFormState, goalInputSchema } from './schemas';

function message(error: unknown, fallback: string) {
  if (error instanceof PlanningError) {
    return error.message;
  }
  if (error instanceof ForbiddenError) {
    return 'Seu papel neste espaço não permite editar o planejamento.';
  }
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  return fallback;
}

export async function setBudgetAction(workspaceId: string, categoryId: string, amountCents: number | null) {
  try {
    await setBudget(workspaceId, { categoryId, amountCents });
    revalidatePath('/planejamento/orcamentos');
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: message(error, 'Não foi possível salvar o orçamento.') };
  }
}

const GOAL_FIELDS = ['name', 'targetCents', 'accountId', 'targetDate'] as const;

export async function saveGoalAction(
  workspaceId: string,
  goalId: string | null,
  _previous: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const values = Object.fromEntries(
    GOAL_FIELDS.map((field) => [field, typeof formData.get(field) === 'string' ? String(formData.get(field)) : '']),
  ) as Record<(typeof GOAL_FIELDS)[number], string>;
  const parsed = goalInputSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Extract<GoalFormState, { status: 'error' }>['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof typeof fieldErrors;
      fieldErrors[field] ??= issue.message;
    }
    return { status: 'error', message: 'Revise os campos destacados.', fieldErrors, values };
  }
  try {
    if (goalId) {
      await updateGoal(workspaceId, goalId, parsed.data);
    } else {
      await createGoal(workspaceId, parsed.data);
    }
  } catch (error) {
    return { status: 'error', message: message(error, 'Não foi possível salvar a meta.'), fieldErrors: {}, values };
  }
  revalidatePath('/planejamento/metas');
  return { status: 'saved' };
}

export async function deleteGoalAction(workspaceId: string, goalId: string) {
  try {
    await deleteGoal(workspaceId, goalId);
    revalidatePath('/planejamento/metas');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
