import { Checkbox } from '@/components/ui/Checkbox';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const WithLabel: Story = {
  render: function Render() {
    const [checked, setChecked] = React.useState(true);
    return (
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={checked} onCheckedChange={(value) => setChecked(value === true)} />
          Incluir na importação
        </label>
        <label className="flex items-center gap-2 text-sm text-typography-neutral-secondary">
          <Checkbox disabled />
          Desabilitado
        </label>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('checkbox', { name: 'Incluir na importação' });
    await expect(box).toBeChecked();
    await userEvent.click(box);
    await expect(box).not.toBeChecked();
    await userEvent.click(within(canvasElement).getByText('Incluir na importação'));
    await expect(box).toBeChecked();
    await expect(within(canvasElement).getByRole('checkbox', { name: 'Desabilitado' })).toBeDisabled();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
