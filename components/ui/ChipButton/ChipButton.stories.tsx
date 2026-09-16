import { ChipButton, MotionChipButton } from '@/components/ui/ChipButton';
import type { Icons } from '@/components/ui/Icon';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AnimatePresence } from 'motion/react';
import { useState } from 'react';

const meta: Meta<typeof ChipButton> = {
  title: 'Design System/ChipButton',
  component: ChipButton,
  argTypes: {
    icon: { control: 'text' },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: {
    icon: 'income',
    selected: false,
    disabled: false,
    children: 'Receitas',
  },
};

export default meta;

type Story = StoryObj<typeof ChipButton>;

const filters: { value: string; label: string; icon: Icons }[] = [
  { value: 'all', label: 'Todas', icon: 'wallet' },
  { value: 'income', label: 'Receitas', icon: 'income' },
  { value: 'expense', label: 'Despesas', icon: 'expense' },
  { value: 'transfer', label: 'Transferências', icon: 'transfer' },
  { value: 'recurring', label: 'Recorrentes', icon: 'recurring' },
];

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const WithoutIcon: Story = {
  args: { icon: undefined, children: 'Só texto' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

function GroupDemo() {
  const [value, setValue] = useState('all');
  return (
    <div className="inline-flex items-center gap-0.5 rounded-control border border-border-neutral-subtle bg-background-neutral-000 p-0.5 shadow-xs">
      {filters.map((filter) => (
        <ChipButton
          key={filter.value}
          icon={filter.icon}
          selected={filter.value === value}
          onClick={() => setValue(filter.value)}
        >
          {filter.label}
        </ChipButton>
      ))}
    </div>
  );
}

export const Group: Story = {
  render: () => <GroupDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const all = canvas.getByRole('button', { name: 'Todas' });
    const expenses = canvas.getByRole('button', { name: 'Despesas' });
    await expect(all).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(expenses);
    await expect(expenses).toHaveAttribute('aria-pressed', 'true');
    await expect(all).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(all);
    await expect(all).toHaveAttribute('aria-pressed', 'true');
  },
};

const SPRING = { type: 'spring', bounce: 0, duration: 0.35 } as const;

function AnimatedDemo() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('all');
  const active = filters.find((filter) => filter.value === value) ?? filters[0];
  return (
    <div className="inline-flex items-center gap-0.5 overflow-hidden rounded-control border border-border-neutral-subtle bg-background-neutral-000 p-0.5 shadow-xs">
      <AnimatePresence mode="popLayout" initial={false}>
        {open ? (
          filters.map((filter, index) => (
            <MotionChipButton
              key={filter.value}
              layout
              icon={filter.icon}
              selected={filter.value === value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ ...SPRING, delay: index * 0.03 }}
              onClick={() => {
                setValue(filter.value);
                setOpen(false);
              }}
            >
              {filter.label}
            </MotionChipButton>
          ))
        ) : (
          <MotionChipButton
            key="trigger"
            layout
            icon={active.icon}
            className="font-medium text-typography-neutral-primary"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={SPRING}
            onClick={() => setOpen(true)}
          >
            {active.label}
          </MotionChipButton>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Animated: Story = {
  render: () => <AnimatedDemo />,
};
