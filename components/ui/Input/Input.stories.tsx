import { Field, Input } from '@/components/ui/Input';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof Input> = {
  title: 'Design System/Input',
  component: Input,
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Input>;

export const WithField: Story = {
  render: () => (
    <Field label="Descrição" description="Como aparece no extrato.">
      {(control) => <Input {...control} placeholder="Ex.: Mercado" />}
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Descrição');
    await expect(input).toHaveAccessibleDescription('Como aparece no extrato.');
    await userEvent.type(input, 'Mercado');
    await expect(input).toHaveValue('Mercado');
    await userEvent.clear(input);
  },
};

export const WithError: Story = {
  render: () => (
    <Field label="E-mail" error="Informe um e-mail válido.">
      {(control) => <Input {...control} type="email" defaultValue="danilo" />}
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('E-mail');
    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription('Informe um e-mail válido.');
  },
};

export const Disabled: Story = {
  render: () => (
    <Field label="Conta">
      {(control) => <Input {...control} disabled defaultValue="Conta corrente" />}
    </Field>
  ),
};
