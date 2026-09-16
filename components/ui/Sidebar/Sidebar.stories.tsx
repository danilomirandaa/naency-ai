import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Icon, type Icons } from '@/components/ui/Icon';
import { Separator } from '@/components/ui/Separator';
import { Sidebar } from '@/components/ui/Sidebar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';

const meta: Meta<typeof Sidebar.Root> = {
  title: 'Design System/Sidebar',
  component: Sidebar.Root,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['sidebar', 'floating', 'inset'] },
    collapsible: { control: 'inline-radio', options: ['offcanvas', 'icon', 'none'] },
  },
  args: {
    variant: 'inset',
    collapsible: 'icon',
  },
};

export default meta;

type Story = StoryObj<typeof Sidebar.Root>;

const items: { title: string; icon: Icons; badge?: number }[] = [
  { title: 'Visão geral', icon: 'dashboard' },
  { title: 'Transações', icon: 'transactions', badge: 12 },
  { title: 'Cartões', icon: 'credit-card' },
  { title: 'Relatórios', icon: 'reports' },
];

function SidebarDemo(args: React.ComponentProps<typeof Sidebar.Root>) {
  const [active, setActive] = useState(items[0].title);

  return (
    <Sidebar.Provider>
      <Sidebar.Root {...args}>
        <Sidebar.Header>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton size="lg">
                <div className="flex aspect-square size-8 items-center justify-center rounded-control-sm bg-background-brand-primary-rest text-typography-brand-on-primary">
                  <Icon icon="wallet" className="size-4" />
                </div>
                <span className="font-semibold">Naency</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Geral</Sidebar.GroupLabel>
            <Sidebar.Menu>
              {items.map((item) => (
                <Sidebar.MenuItem key={item.title}>
                  <Sidebar.MenuButton
                    tooltip={item.title}
                    isActive={active === item.title}
                    onClick={() => setActive(item.title)}
                  >
                    <Icon icon={item.icon} />
                    <span>{item.title}</span>
                  </Sidebar.MenuButton>
                  {item.badge ? (
                    <Sidebar.MenuBadge>{item.badge}</Sidebar.MenuBadge>
                  ) : null}
                </Sidebar.MenuItem>
              ))}
            </Sidebar.Menu>
          </Sidebar.Group>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Carregando</Sidebar.GroupLabel>
            <Sidebar.Menu>
              <Sidebar.MenuItem>
                <Sidebar.MenuSkeleton showIcon width="60%" />
              </Sidebar.MenuItem>
              <Sidebar.MenuItem>
                <Sidebar.MenuSkeleton showIcon width="80%" />
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Rail />
      </Sidebar.Root>
      <Sidebar.Inset>
        <header className="flex h-14 items-center gap-2 px-4">
          <Sidebar.Trigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb.Root>
            <Breadcrumb.List>
              <Breadcrumb.Item>
                <Breadcrumb.Page>{active}</Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb.Root>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-96 flex-1 rounded-2xl bg-background-neutral-100" />
        </div>
      </Sidebar.Inset>
    </Sidebar.Provider>
  );
}

export const Inset: Story = {
  render: (args) => <SidebarDemo {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sidebar = canvasElement.querySelector('[data-slot="sidebar"]');
    const trigger = canvas.getByRole('button', { name: 'Alternar menu (⌘B)' });
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');

    await userEvent.click(canvas.getByRole('button', { name: 'Cartões' }));
    await expect(canvas.getByRole('button', { name: 'Cartões' })).toHaveAttribute(
      'data-active',
      'true',
    );

    await userEvent.click(trigger);
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    await userEvent.click(trigger);
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');

    await userEvent.click(canvas.getByRole('button', { name: 'Visão geral' }));
  },
};

export const Floating: Story = {
  args: { variant: 'floating' },
  render: (args) => <SidebarDemo {...args} />,
};

export const Offcanvas: Story = {
  args: { variant: 'sidebar', collapsible: 'offcanvas' },
  render: (args) => <SidebarDemo {...args} />,
};
