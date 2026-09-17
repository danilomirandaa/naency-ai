'use server';

import { requireMembership } from '@/server/auth/membership';
import { createWorkspace, setActiveWorkspaceCookie } from '@/server/dal/workspaces';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { type CreateWorkspaceState, createWorkspaceSchema } from './schemas';

export async function createWorkspaceAction(
  _previous: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const rawName = formData.get('name');
  // Devolve o que foi digitado: o React limpa o formulário depois da action.
  const name = typeof rawName === 'string' ? rawName : '';
  const parsed = createWorkspaceSchema.safeParse({ name: rawName });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Nome inválido.', name };
  }

  let workspaceId: string;
  try {
    ({ id: workspaceId } = await createWorkspace(parsed.data));
  } catch {
    return { status: 'error', message: 'Não foi possível criar o espaço. Tente de novo.', name };
  }

  await setActiveWorkspaceCookie(workspaceId);
  // Fora do try: redirect() funciona lançando uma exceção.
  redirect('/');
}

export async function selectWorkspaceAction(workspaceId: string) {
  // Só troca para um espaço do qual a pessoa é membro.
  await requireMembership(workspaceId, 'workspace.read');
  await setActiveWorkspaceCookie(workspaceId);
  revalidatePath('/', 'layout');
}
