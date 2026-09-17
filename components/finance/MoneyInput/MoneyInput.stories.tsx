import { MoneyInput } from '@/components/finance/MoneyInput';
import { Field } from '@/components/ui/Input';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta: Meta<typeof MoneyInput> = {
  title: 'Finance/MoneyInput',
  component: MoneyInput,
  args: { onValueChange: fn() },
  render: (args) => (
    <form className="max-w-xs" onSubmit={(event) => event.preventDefault()}>
      <Field label="Valor">{(control) => <MoneyInput {...control} {...args} name="amount" />}</Field>
    </form>
  ),
};

export default meta;

type Story = StoryObj<typeof MoneyInput>;

export const TypingFormatsOnBlur: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Valor');
    await userEvent.type(input, '1234,5');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(123450);

    await userEvent.tab();
    await expect(input).toHaveValue('1.234,50');
    const hidden = canvasElement.querySelector<HTMLInputElement>('input[name="amount"]');
    await expect(hidden?.value).toBe('123450');

    await userEvent.clear(input);
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
    await userEvent.tab();
  },
};

export const WithInitialValue: Story = {
  args: { defaultValue: 34290 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('Valor')).toHaveValue('342,90');
  },
};

export const InvalidText: Story = {
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByLabelText('Valor');
    await userEvent.type(input, '12,345');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
    await expect(input).toBeInvalid();
    await userEvent.clear(input);
    await expect(input).toBeValid();
  },
};

export const NegativeNotAllowed: Story = {
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByLabelText('Valor');
    await userEvent.type(input, '-10');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
    await userEvent.clear(input);
  },
};
