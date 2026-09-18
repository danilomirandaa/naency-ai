'use server';

import { getAiConfig } from '@/server/ai/config';
import { createAnthropicEnricher } from '@/server/ai/enrich';
import { ForbiddenError } from '@/server/auth/errors';
import {
  ImportError,
  commitImportBatch,
  createImportBatch,
  discardImportBatch,
  finishImportJob,
  startImportJob,
  suggestImportCategories,
  updateImportRow,
} from '@/server/dal/imports';
import Anthropic from '@anthropic-ai/sdk';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
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

/**
 * Começa a importação e responde na hora: o trabalho continua no servidor
 * (`after`) e o estado fica no lote, então dá para sair da tela ou recarregar.
 */
export async function commitImportAction(workspaceId: string, batchId: string): Promise<Result> {
  try {
    await startImportJob(workspaceId, batchId, 'commit');
  } catch (error) {
    return failure(error, 'Não foi possível concluir a importação.');
  }
  after(async () => {
    try {
      await commitImportBatch(workspaceId, batchId);
      await finishImportJob(workspaceId, batchId);
      revalidatePath('/', 'layout');
    } catch (error) {
      await finishImportJob(workspaceId, batchId, failure(error, 'Não foi possível concluir a importação.').message);
    }
  });
  return { ok: true };
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

/** Mesma ideia do commit: a AI demora, então a tela não fica presa esperando. */
export async function suggestImportCategoriesAction(workspaceId: string, batchId: string): Promise<Result> {
  const config = getAiConfig();
  if (!config.enabled) {
    return { ok: false, message: 'Sugestões com AI desligadas: falta configurar a ANTHROPIC_API_KEY.' };
  }
  try {
    await startImportJob(workspaceId, batchId, 'suggest');
  } catch (error) {
    return failure(error, 'Não foi possível sugerir categorias.');
  }
  after(async () => {
    try {
      const enricher = createAnthropicEnricher(new Anthropic(), config.models.enrich);
      await suggestImportCategories(workspaceId, batchId, { enricher, model: config.models.enrich });
      await finishImportJob(workspaceId, batchId);
    } catch (error) {
      const message =
        error instanceof Anthropic.APIError
          ? 'A AI não respondeu agora. Tente de novo em instantes.'
          : failure(error, 'Não foi possível sugerir categorias.').message;
      await finishImportJob(workspaceId, batchId, message);
    }
  });
  return { ok: true };
}
