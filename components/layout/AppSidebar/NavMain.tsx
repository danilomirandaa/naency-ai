'use client';

import type { NavItem } from '@/components/layout/navigation';
import { isActivePath } from '@/components/layout/navigation';
import { Icon } from '@/components/ui/Icon';
import { Sidebar } from '@/components/ui/Sidebar';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <Sidebar.Group>
      <Sidebar.GroupLabel>Geral</Sidebar.GroupLabel>
      <Sidebar.Menu>
        {items.map((item) => {
          const isActive = isActivePath(pathname, item.url);

          return (
            <CollapsiblePrimitive.Root
              key={item.url}
              asChild
              defaultOpen={isActive}
            >
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                >
                  <Link href={item.url}>
                    <Icon icon={item.icon} />
                    <span>{item.title}</span>
                  </Link>
                </Sidebar.MenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsiblePrimitive.Trigger asChild>
                      <Sidebar.MenuAction className="data-[state=open]:rotate-90">
                        <Icon icon="chevron-right" />
                        <span className="sr-only">Expandir {item.title}</span>
                      </Sidebar.MenuAction>
                    </CollapsiblePrimitive.Trigger>
                    <CollapsiblePrimitive.Content>
                      <Sidebar.MenuSub>
                        {item.items.map((subItem) => (
                          <Sidebar.MenuSubItem key={subItem.url}>
                            <Sidebar.MenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <Icon icon={subItem.icon} />
                                <span>{subItem.title}</span>
                              </Link>
                            </Sidebar.MenuSubButton>
                          </Sidebar.MenuSubItem>
                        ))}
                      </Sidebar.MenuSub>
                    </CollapsiblePrimitive.Content>
                  </>
                ) : null}
              </Sidebar.MenuItem>
            </CollapsiblePrimitive.Root>
          );
        })}
      </Sidebar.Menu>
    </Sidebar.Group>
  );
}
