import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import type { PanelDataTableColumn } from '@/components/ui/Panel';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';

const meta: Meta = {
  title: 'Design System/Panel',
  component: Panel.Root,
};

export default meta;

type Story = StoryObj;

function SettingsGroupDemo() {
  const [signUpEnabled, setSignUpEnabled] = useState(true);
  const [requireEmail, setRequireEmail] = useState(false);
  const [verifyAtSignUp, setVerifyAtSignUp] = useState(true);
  const [codeMethod, setCodeMethod] = useState(true);
  const [linkMethod, setLinkMethod] = useState(false);

  return (
    <Panel.Root>
      <Panel.Group open={signUpEnabled} onOpenChange={setSignUpEnabled}>
        <Panel.Row bindGroup>
          <Panel.RowHeader>
            <Panel.RowSwitch />
            <Panel.RowText>
              <Panel.RowTitle>Sign-up with email</Panel.RowTitle>
              <Panel.RowDescription>
                Allow users to sign up with their email address
              </Panel.RowDescription>
            </Panel.RowText>
          </Panel.RowHeader>
        </Panel.Row>
        <Panel.GroupContent>
          <Panel.Body>
            <Panel.RowGroup>
              <Panel.Row
                checked={requireEmail}
                onCheckedChange={setRequireEmail}
              >
                <Panel.RowHeader>
                  <Panel.RowSwitch />
                  <Panel.RowText>
                    <Panel.RowTitle>Require email address</Panel.RowTitle>
                    <Panel.RowDescription>
                      Users must provide an email address to sign up and must
                      maintain one on their account at all times
                    </Panel.RowDescription>
                  </Panel.RowText>
                </Panel.RowHeader>
              </Panel.Row>
              <Panel.Row
                checked={verifyAtSignUp}
                onCheckedChange={setVerifyAtSignUp}
              >
                <Panel.RowHeader>
                  <Panel.RowSwitch />
                  <Panel.RowText>
                    <Panel.RowTitle>
                      Verify at sign-up
                      <Panel.RowBadge color="blue">Recommended</Panel.RowBadge>
                    </Panel.RowTitle>
                    <Panel.RowDescription>
                      Require users to verify their email addresses before they
                      can sign-up
                    </Panel.RowDescription>
                  </Panel.RowText>
                </Panel.RowHeader>
                <Panel.RowContent>
                  <Panel.Section>
                    <Panel.SectionTitle>
                      Verification methods
                    </Panel.SectionTitle>
                    <Panel.SectionDescription>
                      Select how users can verify an email address
                    </Panel.SectionDescription>
                  </Panel.Section>
                  <Panel.CheckboxItem
                    label="Email verification code"
                    description="Verify by entering a one-time passcode sent to the email address"
                    checked={codeMethod}
                    onCheckedChange={setCodeMethod}
                  />
                  <Panel.CheckboxItem
                    label="Email verification link"
                    description="Verify by clicking a link sent to the email address"
                    checked={linkMethod}
                    onCheckedChange={setLinkMethod}
                  />
                </Panel.RowContent>
              </Panel.Row>
              <Panel.Row disabled defaultChecked>
                <Panel.RowHeader>
                  <Panel.RowSwitch />
                  <Panel.RowText>
                    <Panel.RowTitle>Disabled row</Panel.RowTitle>
                    <Panel.RowDescription>
                      This row is disabled and cannot be toggled
                    </Panel.RowDescription>
                  </Panel.RowText>
                </Panel.RowHeader>
              </Panel.Row>
            </Panel.RowGroup>
          </Panel.Body>
        </Panel.GroupContent>
      </Panel.Group>
    </Panel.Root>
  );
}

export const SettingsGroup: Story = {
  render: () => <SettingsGroupDemo />,
};

export const RuleList: Story = {
  render: () => (
    <Panel.Root className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-6">
      <Panel.Header className="col-span-full">
        <Panel.Title>User & authentication</Panel.Title>
      </Panel.Header>
      <Panel.LabelRow className="col-span-full grid grid-cols-subgrid">
        <span>Rule</span>
        <span>Status</span>
        <span aria-hidden />
      </Panel.LabelRow>
      <Panel.Body className="col-span-full grid grid-cols-subgrid">
        <Panel.Row className="col-span-full grid grid-cols-subgrid items-center">
          <Panel.RowText>
            <Panel.RowTitle>Lockout policy</Panel.RowTitle>
            <Panel.RowDescription>
              Configure how many login attempts are allowed before an account is
              locked.
            </Panel.RowDescription>
          </Panel.RowText>
          <Panel.RowBadge color="green" className="justify-self-start">
            Enabled
          </Panel.RowBadge>
          <Button variant="outline" className="justify-self-end">
            Manage
          </Button>
        </Panel.Row>
        <Panel.Row className="col-span-full grid grid-cols-subgrid items-center">
          <Panel.RowText>
            <Panel.RowTitle>
              Device Trust
              <Panel.RowBadge>Recommended</Panel.RowBadge>
            </Panel.RowTitle>
            <Panel.RowDescription>
              Helps protect against credential stuffing by treating new devices
              as untrusted for password sign-ins
            </Panel.RowDescription>
          </Panel.RowText>
          <Panel.RowBadge color="gray" className="justify-self-start">
            Disabled
          </Panel.RowBadge>
          <Button variant="outline" className="justify-self-end">
            Enable
          </Button>
        </Panel.Row>
        <Panel.Row className="col-span-full grid grid-cols-subgrid items-center">
          <Panel.RowText>
            <Panel.RowTitle>
              User enumeration protection
              <Panel.RowBadge>Bulk</Panel.RowBadge>
            </Panel.RowTitle>
            <Panel.RowDescription>
              Prevent attackers from determining if even a single email address
              or phone number has an account
            </Panel.RowDescription>
          </Panel.RowText>
          <Panel.RowBadge color="green" className="justify-self-start">
            Enabled
          </Panel.RowBadge>
          <Button variant="outline" className="justify-self-end">
            Manage
          </Button>
        </Panel.Row>
      </Panel.Body>
    </Panel.Root>
  ),
};

export const EmptyState: Story = {
  render: () => (
    <Panel.Root>
      <Panel.Body>
        <Panel.EmptyState
          icon="invoice"
          title="Start earning revenue with Billing"
          description="Create plans and turn your users into paid subscribers. Add features to your plans to easily gate functionality in your app."
        >
          <Button>Enable Billing</Button>
        </Panel.EmptyState>
      </Panel.Body>
      <Panel.Footer>
        <Panel.FooterStart>
          <Icon icon="info-square" className="size-4" />
          <span>
            Learn more about <Panel.Link>Billing</Panel.Link>
          </span>
        </Panel.FooterStart>
      </Panel.Footer>
    </Panel.Root>
  ),
};

export const QueryState: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {(
        [
          { label: 'Loading', props: { isLoading: true } },
          {
            label: 'Loading gauge',
            props: {
              isLoading: true,
              skeleton: <Panel.GaugeSkeleton className="max-w-[140px]" />,
            },
          },
          {
            label: 'Error',
            props: {
              isError: true,
              errorMessage: 'Error loading chart data',
              errorDescription: 'Try refreshing the page.',
            },
          },
          {
            label: 'Empty',
            props: {
              isEmpty: true,
              emptyMessage: 'No data available',
              emptyDescription: 'New entries will appear here.',
              emptyAction: (
                <Button variant="outline" size="small">
                  New entry
                </Button>
              ),
            },
          },
        ] as const
      ).map(({ label, props }) => (
        <Panel.Root key={label} className="flex h-72 flex-col">
          <Panel.Header>
            <Panel.HeaderText>
              <Panel.Title>{label}</Panel.Title>
            </Panel.HeaderText>
          </Panel.Header>
          <Panel.Body className="min-h-0 flex-1">
            <Panel.Content className="flex min-h-0 flex-1 flex-col">
              <Panel.QueryState {...props}>
                <span>content</span>
              </Panel.QueryState>
            </Panel.Content>
          </Panel.Body>
        </Panel.Root>
      ))}
    </div>
  ),
};

export const CardWithFooter: Story = {
  render: () => (
    <Panel.Root>
      <Panel.Body>
        <Panel.Header>
          <Panel.HeaderText>
            <Panel.Title>Sign-ups per day</Panel.Title>
            <Panel.Description>
              Daily count of new user sign-ups
            </Panel.Description>
          </Panel.HeaderText>
          <Panel.HeaderAction>
            <Panel.RowBadge color="green">Live</Panel.RowBadge>
          </Panel.HeaderAction>
        </Panel.Header>
        <Panel.Content>
          <div className="flex h-40 items-center justify-center rounded-control bg-background-neutral-100">
            <Text color="secondary">Chart placeholder</Text>
          </div>
        </Panel.Content>
      </Panel.Body>
      <Panel.Footer>
        <Panel.FooterStart>
          <Icon icon="clock" className="size-4" />
          <span>Updated just now</span>
        </Panel.FooterStart>
        <Panel.FooterEnd>
          <Panel.FooterLink>
            View all users
            <Icon icon="arrow-right" className="size-4" />
          </Panel.FooterLink>
        </Panel.FooterEnd>
      </Panel.Footer>
    </Panel.Root>
  ),
};

export const StandaloneRow: Story = {
  render: () => (
    <Panel.Root>
      <Panel.Row>
        <Panel.RowHeader>
          <Panel.RowSwitch />
          <Panel.RowText>
            <Panel.RowTitle>
              Enable allowlist
              <Panel.RowBadge color="dark">Pro</Panel.RowBadge>
            </Panel.RowTitle>
            <Panel.RowDescription>
              Restrict sign-ups to accounts with pre-approved identifiers.{' '}
              <Panel.Link>Learn more</Panel.Link>
            </Panel.RowDescription>
          </Panel.RowText>
        </Panel.RowHeader>
      </Panel.Row>
    </Panel.Root>
  ),
};

export const CalloutAndDividerLabel: Story = {
  render: () => (
    <Panel.Root>
      <Panel.Header>
        <Panel.HeaderText>
          <Panel.Title>MFA strategies</Panel.Title>
          <Panel.Description>
            Select which multi-factor strategies a user can use to verify their
            identity. <Panel.Link>Learn more</Panel.Link>
          </Panel.Description>
        </Panel.HeaderText>
      </Panel.Header>
      <Panel.Body>
        <Panel.Row disabled>
          <Panel.RowHeader>
            <Panel.RowSwitch />
            <Panel.RowText>
              <Panel.RowTitle>
                SMS verification code
                <Panel.RowBadge color="dark">Pro</Panel.RowBadge>
              </Panel.RowTitle>
              <Panel.RowDescription>
                Send the user a one-time verification code via SMS
              </Panel.RowDescription>
              <Panel.Callout>
                You cannot enable this feature because it requires phone numbers
                to be enabled. <Panel.Link>Enable phone numbers.</Panel.Link>
              </Panel.Callout>
            </Panel.RowText>
          </Panel.RowHeader>
        </Panel.Row>
        <Panel.Row>
          <Panel.RowHeader>
            <Panel.RowSwitch />
            <Panel.RowText>
              <Panel.RowTitle>
                Authenticator application
                <Panel.RowBadge color="dark">Pro</Panel.RowBadge>
              </Panel.RowTitle>
              <Panel.RowDescription>
                Allow users to add an authenticator application to retrieve a
                time-based code from a service such as Google Authenticator
              </Panel.RowDescription>
            </Panel.RowText>
          </Panel.RowHeader>
        </Panel.Row>
        <Panel.DividerLabel>
          Authenticator application must be enabled to generate backup codes
        </Panel.DividerLabel>
        <Panel.Row className="border-t-0">
          <Panel.RowHeader>
            <Panel.RowSwitch />
            <Panel.RowText>
              <Panel.RowTitle>
                Backup codes
                <Panel.RowBadge color="dark">Pro</Panel.RowBadge>
              </Panel.RowTitle>
              <Panel.RowDescription>
                Generate a list of unique codes a user can save and use once
              </Panel.RowDescription>
            </Panel.RowText>
          </Panel.RowHeader>
        </Panel.Row>
      </Panel.Body>
    </Panel.Root>
  ),
};

export const RowWithIconAndAction: Story = {
  render: () => (
    <Panel.Body>
      <Panel.RowGroup>
        <Panel.Row defaultChecked>
          <Panel.RowHeader>
            <Panel.RowIcon icon="shield-lock" />
            <Panel.RowText>
              <Panel.RowTitle>Multi-factor authentication</Panel.RowTitle>
              <Panel.RowDescription>
                Require a second factor when signing in
              </Panel.RowDescription>
            </Panel.RowText>
            <Panel.RowAction>
              <Panel.RowSwitch />
            </Panel.RowAction>
          </Panel.RowHeader>
        </Panel.Row>
        <Panel.Row>
          <Panel.RowHeader>
            <Panel.RowIcon icon="mail" />
            <Panel.RowText>
              <Panel.RowTitle>Email notifications</Panel.RowTitle>
              <Panel.RowDescription>
                Receive a weekly summary by email
              </Panel.RowDescription>
            </Panel.RowText>
            <Panel.RowAction>
              <Panel.RowSwitch />
            </Panel.RowAction>
          </Panel.RowHeader>
        </Panel.Row>
      </Panel.RowGroup>
    </Panel.Body>
  ),
};

export const Skeleton: Story = {
  render: () => (
    <Panel.Body>
      <Panel.HeaderSkeleton />
      <Panel.RowGroup>
        <Panel.RowSkeleton />
        <Panel.RowSkeleton />
        <Panel.RowSkeleton withDescription={false} />
      </Panel.RowGroup>
    </Panel.Body>
  ),
};

type DemoUser = {
  name: string;
  email: string;
  role: string;
  lastSignIn: string;
};

const demoUsers: DemoUser[] = [
  {
    name: 'Rosalind Franklin',
    email: 'rosalind@example.com',
    role: 'Admin',
    lastSignIn: '2026-08-24',
  },
  {
    name: 'Alan Turing',
    email: 'alan@example.com',
    role: 'Member',
    lastSignIn: '2026-08-26',
  },
  {
    name: 'Grace Hopper',
    email: 'grace@example.com',
    role: 'Admin',
    lastSignIn: '2026-08-20',
  },
  {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: 'Member',
    lastSignIn: '2026-08-25',
  },
  {
    name: 'Katherine Johnson',
    email: 'katherine@example.com',
    role: 'Member',
    lastSignIn: '2026-08-18',
  },
  {
    name: 'Edsger Dijkstra',
    email: 'edsger@example.com',
    role: 'Viewer',
    lastSignIn: '2026-08-22',
  },
  {
    name: 'Barbara Liskov',
    email: 'barbara@example.com',
    role: 'Viewer',
    lastSignIn: '2026-08-15',
  },
];

const demoUserColumns: PanelDataTableColumn<DemoUser>[] = [
  {
    key: 'name',
    header: 'User',
    sortValue: (user) => user.name,
    cell: (user) => (
      <div className="flex flex-col">
        <Text size="sm">{user.name}</Text>
        <Text size="xs" color="secondary">
          {user.email}
        </Text>
      </div>
    ),
  },
  {
    key: 'role',
    header: 'Role',
    sortValue: (user) => user.role,
    cell: (user) => (
      <Panel.RowBadge color={user.role === 'Admin' ? 'blue' : 'gray'}>
        {user.role}
      </Panel.RowBadge>
    ),
  },
  {
    key: 'lastSignIn',
    header: 'Last sign-in',
    sortValue: (user) => user.lastSignIn,
    cell: (user) => user.lastSignIn,
  },
];

function DataTableDemo() {
  const [search, setSearch] = useState('');

  return (
    <div className="flex flex-col gap-4">
      <label className="flex h-8 max-w-64 items-center gap-2 rounded-control border border-border-neutral-rest bg-background-neutral-000 px-2.5 shadow-input">
        <Icon icon="search" className="size-4 text-icon-neutral-rest" />
        <input
          placeholder="Search users..."
          className="w-full bg-transparent text-sm text-typography-neutral-primary outline-hidden placeholder:text-typography-neutral-tertiary"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <Panel.Root>
        <Panel.DataTable
          data={demoUsers}
          columns={demoUserColumns}
          getRowKey={(user) => user.email}
          searchTerm={search}
          getSearchText={(user) => `${user.name} ${user.email}`}
          pageSize={5}
          defaultSort={{ key: 'lastSignIn', dir: 'desc' }}
          emptyMessage="No users match your search"
        />
      </Panel.Root>
    </div>
  );
}

export const DataTable: Story = {
  render: () => <DataTableDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByPlaceholderText('Search users...');
    await userEvent.type(search, 'ada');
    await expect(await canvas.findByText('Ada Lovelace')).toBeVisible();
    await expect(canvas.queryByText('Alan Turing')).toBeNull();
    await userEvent.clear(search);
    await expect(await canvas.findByText('Alan Turing')).toBeVisible();
  },
};

export const DataTableCompact: Story = {
  render: () => (
    <Panel.Root>
      <Panel.DataTable
        size="xs"
        data={demoUsers}
        columns={demoUserColumns}
        getRowKey={(user) => user.email}
        defaultSort={{ key: 'name', dir: 'asc' }}
      />
    </Panel.Root>
  ),
};

export const DataTableLoading: Story = {
  render: () => (
    <Panel.Root>
      <Panel.DataTable
        isLoading
        data={undefined}
        columns={demoUserColumns}
        getRowKey={(user) => user.email}
        pageSize={5}
      />
    </Panel.Root>
  ),
};

export const DataTableEmpty: Story = {
  render: () => (
    <Panel.Root>
      <Panel.DataTable
        data={[]}
        columns={demoUserColumns}
        getRowKey={(user) => user.email}
        emptyMessage="No users found"
      />
    </Panel.Root>
  ),
};

export const FieldList: Story = {
  render: () => (
    <Panel.Root className="max-w-sm pt-0">
      <div className="flex h-10 items-center px-4">
        <Text size="xs" weight="medium" color="secondary">
          Event
        </Text>
      </div>
      <Panel.Body className="flex flex-col gap-4 p-4">
        <Panel.FieldList variant="bordered" label="Event information">
          <Panel.Field
            label="Actor"
            value="user_37tlzYmbBJov1z8XapgSrX67F76"
            href="#top"
            mono
          />
          <Panel.Field label="Type" value="sign_in.completed" mono />
          <Panel.Field
            label="Event ID"
            value="01a03d6d-879f-775b-a8bc-5707a57a074b"
            mono
            copyValue="01a03d6d-879f-775b-a8bc-5707a57a074b"
          />
          <Panel.Field label="Timestamp" value="Aug 26, 2026, 5:36:23 AM" />
          <Panel.Field label="Description" value="Sign in was completed" />
          <Panel.Field label="Status">
            <Panel.RowBadge color="green">Completed</Panel.RowBadge>
          </Panel.Field>
          <Panel.Field
            label="IP Address"
            value="170.254.20.12"
            mono
            copyValue="170.254.20.12"
          />
        </Panel.FieldList>
        <Panel.FieldList label="Device (plain, default)">
          <Panel.Field label="Source" value="frontend-api" mono />
          <Panel.Field
            label="Device"
            value="client_3HamXP8XXs4BdcS8uHIgkMqIblC"
            mono
            copyValue="client_3HamXP8XXs4BdcS8uHIgkMqIblC"
          />
          <Panel.Field label="Last seen" value="Aug 26, 2026, 5:36 AM" />
        </Panel.FieldList>
        <Panel.FieldList variant="divided" label="Session (divided)">
          <Panel.Field
            label="Session ID"
            value="sess_3IRowuvEoWOFNUr2Tv5WflaRg1D"
            mono
            copyValue="sess_3IRowuvEoWOFNUr2Tv5WflaRg1D"
          />
          <Panel.Field label="Strategy" value="oauth_google" mono />
          <Panel.Field label="Duration" value="6379 ms" />
        </Panel.FieldList>
      </Panel.Body>
    </Panel.Root>
  ),
};
