'use server';

import { ForbiddenError } from '@/server/auth/errors';
import {
  ImportError,
  commitImportBatch,
  createImportBatch,
  discardImportBatch,
  updateImportRow,
} from '@/server/dal/imports';
import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import type { CreateImportInput, UpdateImportRowInput } from './schemas';

type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string };

function failure(error: unknown, fallback: string): { ok: false; message: string } {
  if (error instanceof ImportError) {
    return { ok: false, message: error.message };
  }
  if (error instanceof ForbiddenError) {
    return { ok: false, message: 'Seu papel neste espaço não permite importar extratos.' };
  }
  if (error instanceof ZodError) {
    return { ok: false, message: error.issues[0]?.message ?? fallback };
  }
  return { ok: false, message: fallback };
}

export async function createImportAction(
  workspaceId: string,
  input: CreateImportInput,
): Promise<Result<{ batchId: string }>> {
  try {
    const { id } = await createImportBatch(workspaceId, input);
    revalidatePath('/importar');
    return { ok: true, batchId: id };
  } catch (error) {
    return failure(error, 'Não foi possível ler o arquivo. Tente de novo.');
  }
}

export async function updateImportRowAction(
  workspaceId: string,
  rowId: string,
  changes: UpdateImportRowInput,
): Promise<Result> {
  try {
    await updateImportRow(workspaceId, rowId, changes);
    return { ok: true };
  } catch (error) {
    return failure(error, 'Não foi possível alterar a linha.');
  }
}

export async function commitImportAction(
  workspaceId: string,
  batchId: string,
): Promise<Result<{ created: number; accountId: string }>> {
  try {
    const result = await commitImportBatch(workspaceId, batchId);
    revalidatePath('/', 'layout');
    return { ok: true, ...result };
  } catch (error) {
    return failure(error, 'Não foi possível concluir a importação.');
  }
}

export async function discardImportAction(workspaceId: string, batchId: string): Promise<Result> {
  try {
    await discardImportBatch(workspaceId, batchId);
    revalidatePath('/importar');
    return { ok: true };
  } catch (error) {
    return failure(error, 'Não foi possível descartar a importação.');
  }
}
