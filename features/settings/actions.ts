'use server';

import { ForbiddenError } from '@/server/auth/errors';
import { renameWorkspace } from '@/server/dal/workspaces';
import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';

export type RenameWorkspaceState =
  | { status: 'idle' }
  | { status: 'saved' }
  | { status: 'error'; message: string; name: string };

export async function renameWorkspaceAction(
  workspaceId: string,
  _previous: RenameWorkspaceState,
  formData: FormData,
): Promise<RenameWorkspaceState> {
  const name = typeof formData.get('name') === 'string' ? String(formData.get('name')) : '';
  try {
    await renameWorkspace(workspaceId, { name });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? (error.issues[0]?.message ?? 'Nome inválido.')
        : error instanceof ForbiddenError
          ? 'Só administradores renomeiam o espaço.'
          : 'Não foi possível renomear. Tente de novo.';
    return { status: 'error', message, name };
  }
  revalidatePath('/', 'layout');
  return { status: 'saved' };
}
