import { Switch } from '@/components/ui/Switch';
import { useOptimisticToggle } from '@/hooks/useOptimisticToggle';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof Switch> = {
  title: 'Design System/Switch',
  component: Switch,
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['normal', 'small', 'tiny'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {
    size: 'small',
    defaultChecked: true,
    disabled: false,
    'aria-label': 'Notificações por e-mail',
  },
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole('switch', {
      name: 'Notificações por e-mail',
    });
    await expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
  },
};

export const Loading: Story = {
  args: {
    size: 'small',
    defaultChecked: true,
    isLoading: true,
    'aria-label': 'Notificações por e-mail',
  },
};

function OptimisticDemo() {
  const { checked, isLoading, errorKey, toggle } = useOptimisticToggle({
    checked: false,
    onToggle: (next) =>
      new Promise((resolve) => setTimeout(() => resolve(!next), 900)),
  });
  return (
    <div className="flex items-center gap-3">
      <Switch
        id="optimistic-switch"
        size="normal"
        checked={checked}
        isLoading={isLoading}
        errorKey={errorKey}
        onCheckedChange={toggle}
      />
      <label
        htmlFor="optimistic-switch"
        className="text-sm text-typography-neutral-primary"
      >
        Turning on fails after 900ms and shakes back; turning off succeeds.
      </label>
    </div>
  );
}

export const Optimistic: Story = {
  render: () => <OptimisticDemo />,
};

export const Gallery: Story = {
  render: () => (
    <div className="grid w-fit grid-cols-6 items-center gap-4">
      {(['normal', 'small', 'tiny'] as const).map((size) => (
        <div key={size} className="contents">
          <span className="text-sm text-typography-neutral-primary">{size}</span>
          <Switch size={size} aria-label={`${size} desligado`} />
          <Switch size={size} defaultChecked aria-label={`${size} ligado`} />
          <Switch
            size={size}
            disabled
            defaultChecked
            aria-label={`${size} desabilitado`}
          />
          <Switch size={size} isLoading aria-label={`${size} carregando`} />
          <Switch
            size={size}
            isLoading
            defaultChecked
            aria-label={`${size} carregando ligado`}
          />
        </div>
      ))}
    </div>
  ),
};
