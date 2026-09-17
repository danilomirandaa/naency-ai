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

function hiddenValue(canvasElement: HTMLElement) {
  return canvasElement.querySelector<HTMLInputElement>('input[name="amount"]')?.value;
}

export const FormatsWhileTyping: Story = {
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByLabelText('Valor');
    await userEvent.type(input, '1');
    await expect(input).toHaveValue('0,01');
    await userEvent.type(input, '23456');
    await expect(input).toHaveValue('1.234,56');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(123456);
    await expect(hiddenValue(canvasElement)).toBe('123456');

    await userEvent.type(input, '{Backspace}');
    await expect(input).toHaveValue('123,45');

    await userEvent.clear(input);
    await expect(input).toHaveValue('');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
    await expect(hiddenValue(canvasElement)).toBe('');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const WithInitialValue: Story = {
  args: { defaultValue: 34290 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('Valor')).toHaveValue('342,90');
  },
};

export const PasteFormattedValue: Story = {
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByLabelText('Valor');
    await userEvent.click(input);
    await userEvent.paste('R$ 1.500,5');
    await expect(input).toHaveValue('1.500,50');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(150050);
    await userEvent.clear(input);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Negative: Story = {
  args: { allowNegative: true },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByLabelText('Valor');
    await userEvent.type(input, '-1550');
    await expect(input).toHaveValue('-15,50');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(-1550);
    await userEvent.type(input, '-');
    await expect(input).toHaveValue('15,50');
    await userEvent.clear(input);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const NegativeNotAllowed: Story = {
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByLabelText('Valor');
    await userEvent.type(input, '-10');
    await expect(input).toHaveValue('0,10');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(10);
    await userEvent.clear(input);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
