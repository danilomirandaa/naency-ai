import { DatePicker } from '@/components/ui/DatePicker';
import { Field } from '@/components/ui/Input';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof DatePicker> = {
  title: 'UI/DatePicker',
  component: DatePicker,
  args: { onValueChange: fn() },
  render: (args) => (
    <form className="max-w-xs" onSubmit={(event) => event.preventDefault()}>
      <Field label="Data do saldo">
        {(control) => <DatePicker {...control} {...args} name="date" />}
      </Field>
    </form>
  ),
};

export default meta;

type Story = StoryObj<typeof DatePicker>;

function formValue(canvasElement: HTMLElement) {
  const form = canvasElement.querySelector('form');
  return new FormData(form ?? undefined).get('date');
}

export const PickDate: Story = {
  args: { defaultValue: '2026-09-16', max: '2026-09-16' },
  play: async ({ canvasElement, args }) => {
    const trigger = within(canvasElement).getByLabelText('Data do saldo');
    await expect(trigger).toHaveTextContent('16/09/2026');
    await expect(formValue(canvasElement)).toBe('2026-09-16');

    await userEvent.click(trigger);
    const dialog = within(await screen.findByRole('dialog'));
    await expect(dialog.getByRole('button', { name: /17 de setembro de 2026/ })).toBeDisabled();
    await userEvent.click(dialog.getByRole('button', { name: / 1 de setembro de 2026/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveTextContent('01/09/2026');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-09-01');
    await expect(formValue(canvasElement)).toBe('2026-09-01');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByLabelText('Data do saldo');
    await expect(trigger).toHaveTextContent('Escolha a data');
    await expect(formValue(canvasElement)).toBe('');
  },
};

export const EscapeCloses: Story = {
  args: { defaultValue: '2026-09-16' },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByLabelText('Data do saldo'));
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(args.onValueChange).not.toHaveBeenCalled();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Invalid: Story = {
  render: (args) => (
    <div className="max-w-xs">
      <Field label="Data do saldo" error="Informe a data do saldo.">
        {(control) => <DatePicker {...control} {...args} />}
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByLabelText('Data do saldo');
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
  },
};
