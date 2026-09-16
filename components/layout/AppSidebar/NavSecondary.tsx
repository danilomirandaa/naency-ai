'use client';

import type { NavItem } from '@/components/layout/navigation';
import { isActivePath } from '@/components/layout/navigation';
import { Icon } from '@/components/ui/Icon';
import { Sidebar } from '@/components/ui/Sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type * as React from 'react';

export function NavSecondary({
  items,
  ...props
}: { items: NavItem[] } & React.ComponentProps<typeof Sidebar.Group>) {
  const pathname = usePathname();

  return (
    <Sidebar.Group {...props}>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {items.map((item) => (
            <Sidebar.MenuItem key={item.url}>
              <Sidebar.MenuButton
                asChild
                size="sm"
                tooltip={item.title}
                isActive={isActivePath(pathname, item.url)}
              >
                <Link href={item.url}>
                  <Icon icon={item.icon} />
                  <span>{item.title}</span>
                </Link>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          ))}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  );
}
