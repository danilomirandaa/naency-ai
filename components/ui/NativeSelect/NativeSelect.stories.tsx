import { Field } from '@/components/ui/Input';
import { NativeSelect } from '@/components/ui/NativeSelect';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof NativeSelect> = {
  title: 'UI/NativeSelect',
  component: NativeSelect,
  render: (args) => (
    <div className="flex max-w-xs flex-col gap-4">
      <Field label="Tipo">
        {(control) => (
          <NativeSelect {...control} {...args}>
            <option value="">Escolha…</option>
            <option value="checking">Conta corrente</option>
            <option value="savings">Poupança</option>
          </NativeSelect>
        )}
      </Field>
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof NativeSelect>;

export const Default: Story = {
  args: { defaultValue: '' },
  play: async ({ canvasElement }) => {
    const select = within(canvasElement).getByLabelText('Tipo');
    await userEvent.selectOptions(select, 'savings');
    await expect(select).toHaveValue('savings');
    await userEvent.selectOptions(select, '');
    await expect(select).toHaveValue('');
  },
};

export const Invalid: Story = {
  render: (args) => (
    <div className="max-w-xs">
      <Field label="Tipo" error="Escolha o tipo da conta.">
        {(control) => (
          <NativeSelect {...control} {...args} defaultValue="">
            <option value="">Escolha…</option>
          </NativeSelect>
        )}
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const select = within(canvasElement).getByLabelText('Tipo');
    await expect(select).toBeInvalid();
    await expect(select).toHaveAccessibleDescription('Escolha o tipo da conta.');
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'checking' },
};
