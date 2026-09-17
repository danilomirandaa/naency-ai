import { Calendar } from '@/components/ui/Calendar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta: Meta<typeof Calendar> = {
  title: 'UI/Calendar',
  component: Calendar,
};

export default meta;

type Story = StoryObj<typeof Calendar>;

const onSelect = fn();

export const SingleInPortuguese: Story = {
  render: function Render() {
    const [selected, setSelected] = React.useState<Date | undefined>(new Date(2026, 8, 16));
    return (
      <Calendar
        mode="single"
        selected={selected}
        onSelect={(date) => {
          setSelected(date);
          onSelect(date);
        }}
        defaultMonth={new Date(2026, 8, 1)}
        today={new Date(2026, 8, 16)}
        className="rounded-control-lg border border-border-neutral-subtle"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('setembro 2026')).toBeInTheDocument();
    // Semana começa no domingo, com nomes em português.
    const weekdays = [...canvasElement.querySelectorAll('.rdp-weekday')].map((cell) => cell.textContent);
    await expect(weekdays[0]).toMatch(/^dom/);

    await userEvent.click(canvas.getByRole('button', { name: /20 de setembro de 2026/ }));
    await expect(onSelect).toHaveBeenLastCalledWith(new Date(2026, 8, 20));
    await userEvent.click(canvas.getByRole('button', { name: /16 de setembro de 2026/ }));
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const WithDropdownsAndLimits: Story = {
  args: {
    mode: 'single',
    captionLayout: 'dropdown',
    defaultMonth: new Date(2026, 8, 1),
    today: new Date(2026, 8, 16),
    startMonth: new Date(2020, 0),
    endMonth: new Date(2026, 8),
    disabled: { after: new Date(2026, 8, 16) },
    className: 'rounded-control-lg border border-border-neutral-subtle',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /17 de setembro de 2026/ })).toBeDisabled();
    await expect(canvas.getByRole('combobox', { name: /mês/i })).toHaveValue('8');
  },
};
