import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { Tabs, TabsRoot } from '@/components/ui/Tabs';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';

const meta: Meta<typeof TabsRoot> = {
  title: 'Design System/Tabs',
  component: TabsRoot,
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
    size: { control: 'inline-radio', options: ['medium', 'small'] },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
  },
  args: {
    variant: 'primary',
    size: 'medium',
    orientation: 'horizontal',
  },
};

export default meta;

type Story = StoryObj<typeof TabsRoot>;

const basicTabs = [
  { value: 'details', label: 'Details' },
  { value: 'management', label: 'Management' },
  { value: 'advanced', label: 'Advanced' },
];

const manyTabs = [
  'Overview',
  'Devices & Vulnerabilities',
  'Recommendations',
  'Compliance',
  'Reports',
  'Files',
  'Contacts',
  'Network topology',
  'Threat events',
  'Settings',
];

function BasicTabs(props: React.ComponentProps<typeof TabsRoot>) {
  return (
    <Tabs.Root defaultValue={basicTabs[0].value} {...props}>
      <Tabs.List>
        {basicTabs.map((tab) => (
          <Tabs.Tab key={tab.value} value={tab.value}>
            {tab.label}
          </Tabs.Tab>
        ))}
        <Tabs.Tab value="disabled" disabled>
          Disabled
        </Tabs.Tab>
      </Tabs.List>
      {basicTabs.map((tab) => (
        <Tabs.Panel key={tab.value} value={tab.value}>
          <Text size="sm" color="secondary">
            {tab.label} content
          </Text>
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}

export const Primary: Story = {
  render: (args) => <BasicTabs {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const management = canvas.getByRole('tab', { name: 'Management' });
    await userEvent.click(management);
    await expect(management).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByText('Management content')).toBeVisible();
    await expect(canvas.getByRole('tab', { name: 'Disabled' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('tab', { name: 'Details' }));
    await expect(canvas.getByText('Details content')).toBeVisible();
  },
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
  render: (args) => <BasicTabs {...args} />,
};

export const Small: Story = {
  args: { size: 'small' },
  render: (args) => <BasicTabs {...args} />,
};

export const Vertical: Story = {
  args: { variant: 'secondary', orientation: 'vertical' },
  render: (args) => <BasicTabs {...args} />,
};

export const Overflow: Story = {
  name: 'Overflow with scroll buttons',
  render: (args) => (
    <div className="w-96">
      <Tabs.Root defaultValue={manyTabs[0]} {...args}>
        <Tabs.List>
          {manyTabs.map((tab) => (
            <Tabs.Tab key={tab} value={tab}>
              {tab}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {manyTabs.map((tab) => (
          <Tabs.Panel key={tab} value={tab}>
            <Text size="sm" color="secondary">
              {tab} content
            </Text>
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </div>
  ),
};

export const AsLinks: Story = {
  name: 'Tabs as links (route navigation)',
  args: { variant: 'secondary' },
  render: (args) => (
    <Tabs.Root value="threats" {...args}>
      <Tabs.List>
        <Tabs.Tab value="summary" href="#summary">
          Summary
        </Tabs.Tab>
        <Tabs.Tab value="threats" href="#threats">
          Threats
        </Tabs.Tab>
        <Tabs.Tab value="reports" href="#reports">
          Reports
        </Tabs.Tab>
      </Tabs.List>
    </Tabs.Root>
  ),
};

const deviceFilters = [
  { value: 'all', label: 'All devices', count: 128 },
  { value: 'firewall', label: 'Firewalls', count: 12 },
  { value: 'sensor', label: 'Sensors', count: 9 },
  { value: 'other', label: 'Other', count: 107 },
];

function PanelFilterDemo() {
  const [filter, setFilter] = useState('all');

  // As abas envolvem o Panel inteiro para que cada uma controle o seu painel
  // (semântica de tabs válida para leitores de tela).
  return (
    <Tabs.Root size="small" value={filter} onValueChange={setFilter}>
      <Panel.Root className="max-w-3xl">
        <Panel.Header>
          <Panel.HeaderText>
            <Panel.Title>Devices</Panel.Title>
            <Panel.Description>
              Small tabs in the header act as the card filter.
            </Panel.Description>
          </Panel.HeaderText>
          <Panel.HeaderAction>
            <Tabs.List>
              {deviceFilters.map((item) => (
                <Tabs.Tab key={item.value} value={item.value}>
                  {item.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Panel.HeaderAction>
        </Panel.Header>
        <Panel.Body>
          {deviceFilters.map((item) => (
            <Tabs.Panel key={item.value} value={item.value}>
              <Panel.Content className="p-6">
                <Text size="sm" color="secondary">
                  Showing {item.count} {item.label.toLowerCase()}.
                </Text>
              </Panel.Content>
            </Tabs.Panel>
          ))}
        </Panel.Body>
      </Panel.Root>
    </Tabs.Root>
  );
}

export const PanelFilter: Story = {
  name: 'As a Panel header filter',
  render: () => <PanelFilterDemo />,
};
