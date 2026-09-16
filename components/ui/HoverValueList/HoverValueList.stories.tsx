import { HoverValueList } from '@/components/ui/HoverValueList';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof HoverValueList> = {
  title: 'Design System/HoverValueList',
  component: HoverValueList,
  decorators: [
    (StoryComponent) => (
      <div className="flex min-h-96 items-start p-8">
        <StoryComponent />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof HoverValueList>;

const companies = [
  'Adkins and Sons',
  'Armstrong, Hancock and Meyers',
  'Branch, Hill and Daniel',
  'Hensley PLC',
  'Lopez, Smith and Campos',
  'Nelson-Gates',
  'Powers, Lewis and Garza',
  'Carney, Burnett and Good',
];

export const Links: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByText('+6 more');
    await userEvent.hover(trigger);
    // Espera a animação de entrada terminar (opacidade 0 conta como invisível).
    await waitFor(() => expect(screen.getByText('Asset owner')).toBeVisible());
    await userEvent.unhover(trigger);
    await waitFor(() => expect(screen.queryByText('Asset owner')).toBeNull());
  },
  render: () => (
    <HoverValueList maxVisible={2} label="Asset owner">
      {companies.map((company) => (
        <a
          key={company}
          href="#top"
          className="text-text-link text-xs hover:underline"
        >
          {company}
        </a>
      ))}
    </HoverValueList>
  ),
};

export const Badges: Story = {
  render: () => (
    <HoverValueList maxVisible={2} label="Compliance">
      {['NIS2', 'CSRB', 'CAF', 'NIST CSF 2.0', 'IEC 62443'].map((framework) => (
        <Panel.RowBadge key={framework} color="gray">
          {framework}
        </Panel.RowBadge>
      ))}
    </HoverValueList>
  ),
};

export const SingleVisible: Story = {
  render: () => (
    <HoverValueList
      maxVisible={1}
      label="Funds"
      triggerLabel={(count) => `+${count} funds`}
    >
      {companies.map((company) => (
        <Text key={company} size="xs">
          {company}
        </Text>
      ))}
    </HoverValueList>
  ),
};

export const NoOverflow: Story = {
  render: () => (
    <HoverValueList maxVisible={3} label="Asset owner">
      {companies.slice(0, 2).map((company) => (
        <a
          key={company}
          href="#top"
          className="text-text-link text-xs hover:underline"
        >
          {company}
        </a>
      ))}
    </HoverValueList>
  ),
};
