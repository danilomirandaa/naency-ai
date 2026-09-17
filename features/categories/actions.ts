'use server';

import { ForbiddenError } from '@/server/auth/errors';
import {
  CategoryError,
  createCategory,
  setCategoryArchived,
  updateCategory,
} from '@/server/dal/categories';
import { revalidatePath } from 'next/cache';
import { type CategoryFormState, parseCategoryForm, readCategoryForm } from './schemas';

function failure(formData: FormData, error: unknown): CategoryFormState {
  const message =
    error instanceof ForbiddenError
      ? 'Seu papel neste espaço não permite editar categorias.'
      : error instanceof CategoryError
        ? error.message
        : 'Não foi possível salvar a categoria. Tente de novo.';
  const fieldErrors =
    error instanceof CategoryError && error.code === 'duplicate' ? { name: error.message } : {};
  return { status: 'error', message, fieldErrors, values: readCategoryForm(formData) };
}

export async function createCategoryAction(
  workspaceId: string,
  _previous: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const parsed = parseCategoryForm(formData);
  if (!('success' in parsed)) {
    return parsed;
  }
  try {
    const { id } = await createCategory(workspaceId, parsed.data);
    revalidatePath('/categorias');
    return { status: 'saved', categoryId: id };
  } catch (error) {
    return failure(formData, error);
  }
}

export async function updateCategoryAction(
  workspaceId: string,
  categoryId: string,
  _previous: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const parsed = parseCategoryForm(formData);
  if (!('success' in parsed)) {
    return parsed;
  }
  try {
    await updateCategory(workspaceId, categoryId, parsed.data);
    revalidatePath('/categorias');
    return { status: 'saved', categoryId };
  } catch (error) {
    return failure(formData, error);
  }
}

export async function setCategoryArchivedAction(
  workspaceId: string,
  categoryId: string,
  archived: boolean,
): Promise<{ ok: boolean }> {
  try {
    await setCategoryArchived(workspaceId, categoryId, archived);
    revalidatePath('/categorias');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
