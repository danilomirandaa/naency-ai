import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { signOutAction } from '@/features/auth/actions';
import { requireUser } from '@/server/auth/current-user';
import { defaultProfileName, getProfile } from '@/server/dal/profiles';
import { SIDEBAR_COOKIE_NAME, Sidebar } from '@/components/ui/Sidebar';
import { cookies } from 'next/headers';
import type * as React from 'react';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Checagem de verdade (o proxy só faz a otimista).
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== 'false';

  return (
    <Sidebar.Provider defaultOpen={defaultOpen}>
      <AppSidebar
        user={{
          name: profile?.name ?? defaultProfileName(user.email),
          description: user.email ?? 'Conta pessoal',
        }}
        signOutAction={signOutAction}
      />
      <Sidebar.Inset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </Sidebar.Inset>
    </Sidebar.Provider>
  );
}
