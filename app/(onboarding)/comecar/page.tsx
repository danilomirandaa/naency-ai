import { AuthShell } from '@/components/layout/AuthShell';
import { createWorkspaceAction } from '@/features/workspaces/actions';
import { CreateWorkspaceForm } from '@/features/workspaces/components/CreateWorkspaceForm';
import { requireUser } from '@/server/auth/current-user';
import { listMyWorkspaces } from '@/server/dal/workspaces';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Criar espaço · Naency',
};

export default async function CreateWorkspacePage({ searchParams }: PageProps<'/comecar'>) {
  await requireUser();
  const [workspaces, params] = await Promise.all([listMyWorkspaces(), searchParams]);
  const wantsAnother = params.novo === '1';

  // Quem já tem espaço só vê esta tela ao pedir um novo.
  if (workspaces.length > 0 && !wantsAnother) {
    redirect('/');
  }

  return (
    <AuthShell>
      <CreateWorkspaceForm
        action={createWorkspaceAction}
        backHref={workspaces.length > 0 ? '/' : undefined}
      />
    </AuthShell>
  );
}
