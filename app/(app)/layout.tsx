import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SIDEBAR_COOKIE_NAME, Sidebar } from '@/components/ui/Sidebar';
import { cookies } from 'next/headers';
import type * as React from 'react';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== 'false';

  return (
    <Sidebar.Provider defaultOpen={defaultOpen}>
      <AppSidebar />
      <Sidebar.Inset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </Sidebar.Inset>
    </Sidebar.Provider>
  );
}
