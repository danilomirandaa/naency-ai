import { DateInput } from '@/components/finance/DateInput';
import { Field } from '@/components/ui/Input';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof DateInput> = {
  title: 'Finance/DateInput',
  component: DateInput,
  render: (args) => (
    <form className="max-w-xs" onSubmit={(event) => event.preventDefault()}>
      <Field label="Data do saldo">
        {(control) => <DateInput {...control} {...args} name="date" />}
      </Field>
    </form>
  ),
};

export default meta;

type Story = StoryObj<typeof DateInput>;

export const WithValue: Story = {
  args: { defaultValue: '2026-09-16' },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('Data do saldo');
    await expect(input).toHaveValue('2026-09-16');
    const form = canvasElement.querySelector('form');
    await expect(new FormData(form ?? undefined).get('date')).toBe('2026-09-16');
  },
};

export const Cleared: Story = {
  args: { defaultValue: '2026-09-16', required: true },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('Data do saldo');
    await userEvent.clear(input);
    await expect(input).toHaveValue('');
    await expect(input).toBeInvalid();
  },
};

export const OutOfRange: Story = {
  args: { defaultValue: '2026-10-01', max: '2026-09-16' },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('Data do saldo');
    await expect(input).toBeInvalid();
  },
};
