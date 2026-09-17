import { PageHeader } from '@/components/layout/PageHeader';
import { renameWorkspaceAction } from '@/features/settings/actions';
import { AiUsageCard } from '@/features/settings/components/AiUsageCard';
import { CreditsCard } from '@/features/settings/components/CreditsCard';
import { WorkspaceSettingsForm } from '@/features/settings/components/WorkspaceSettingsForm';
import { currentMonth } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { getAiConfig } from '@/server/ai/config';
import { getAiUsageSummary } from '@/server/dal/settings';
import { getActiveWorkspace } from '@/server/dal/workspaces';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Configurações · Naency',
};

export default async function SettingsPage() {
  const { active } = await getActiveWorkspace();
  if (!active) {
    redirect('/comecar');
  }
  const ai = getAiConfig();
  const usage = await getAiUsageSummary(active.id, currentMonth());
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <PageHeader title="Configurações" description={active.name} />
      <WorkspaceSettingsForm
        name={active.name}
        canManage={can(active.role, 'workspace.manage')}
        action={renameWorkspaceAction.bind(null, active.id)}
      />
      <AiUsageCard enabled={ai.enabled} model={ai.models.enrich} usage={usage} />
      <CreditsCard />
    </div>
  );
}
