'use client';

import { getBreadcrumb } from '@/components/layout/navigation';
import { HeaderPeriodPicker } from '@/components/layout/HeaderPeriodPicker';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Separator } from '@/components/ui/Separator';
import { Sidebar } from '@/components/ui/Sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

export type AppHeaderProps = {
  /** Cookie do período global (lido no layout). */
  periodCookie?: string | null;
  /** "AAAA-MM-DD" de hoje, para os atalhos de período. */
  today: string;
};

export function AppHeader({ periodCookie = null, today }: AppHeaderProps) {
  const pathname = usePathname();
  const trail = getBreadcrumb(pathname);

  return (
    // Fixo no topo ao rolar. Gruda em top-0: com a margem do cartão de conteúdo
    // (Sidebar.Inset), qualquer folga deixaria o conteúdo passar acima dele.
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-border-neutral-subtle border-b bg-background px-4 md:rounded-t-2xl">
      <Sidebar.Trigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb.Root>
        <Breadcrumb.List>
          {trail.map((crumb, index) => {
            const isLast = index === trail.length - 1;
            return (
              <Fragment key={crumb.url}>
                {index > 0 && (
                  <Breadcrumb.Separator className="hidden md:block" />
                )}
                <Breadcrumb.Item className={isLast ? undefined : 'hidden md:block'}>
                  {isLast ? (
                    <Breadcrumb.Page>{crumb.title}</Breadcrumb.Page>
                  ) : (
                    <Breadcrumb.Link asChild>
                      <Link href={crumb.url}>{crumb.title}</Link>
                    </Breadcrumb.Link>
                  )}
                </Breadcrumb.Item>
              </Fragment>
            );
          })}
        </Breadcrumb.List>
      </Breadcrumb.Root>
      <div className="ml-auto flex min-w-0 items-center gap-2">
        <div className="hidden overflow-x-auto md:block">
          <HeaderPeriodPicker periodCookie={periodCookie} today={today} />
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
