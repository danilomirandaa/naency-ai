import { MonthPicker } from '@/components/finance/MonthPicker';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof MonthPicker> = {
  title: 'Finance/MonthPicker',
  component: MonthPicker,
};

export default meta;

type Story = StoryObj<typeof MonthPicker>;

export const AcrossYears: Story = {
  render: function Render() {
    const [month, setMonth] = React.useState('2026-01');
    return <MonthPicker value={month} onValueChange={setMonth} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Janeiro de 2026')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Mês anterior' }));
    await expect(canvas.getByText('Dezembro de 2025')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Próximo mês' }));
    await expect(canvas.getByText('Janeiro de 2026')).toBeInTheDocument();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
