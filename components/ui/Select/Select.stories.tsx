import { Field } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta = {
  title: 'UI/Select',
};

export default meta;

type Story = StoryObj;

function TypeSelect({ error, disabled }: { error?: string; disabled?: boolean }) {
  return (
    <form className="max-w-xs" onSubmit={(event) => event.preventDefault()}>
      <Field label="Tipo" error={error}>
        {(control) => (
          <Select.Root name="type" disabled={disabled} defaultValue={disabled ? 'savings' : undefined}>
            <Select.Trigger {...control}>
              <Select.Value placeholder="Escolha…" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="checking">Conta corrente</Select.Item>
              <Select.Item value="savings">Poupança</Select.Item>
              <Select.Item value="investment">Investimentos</Select.Item>
            </Select.Content>
          </Select.Root>
        )}
      </Field>
    </form>
  );
}

export const Default: Story = {
  render: () => <TypeSelect />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByLabelText('Tipo');
    await expect(trigger).toHaveTextContent('Escolha…');

    await userEvent.click(trigger);
    const listbox = within(await screen.findByRole('listbox'));
    await userEvent.click(listbox.getByRole('option', { name: 'Poupança' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());

    await expect(trigger).toHaveTextContent('Poupança');
    const form = canvasElement.querySelector('form');
    await expect(new FormData(form ?? undefined).get('type')).toBe('savings');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const KeyboardSelection: Story = {
  render: () => <TypeSelect />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByLabelText('Tipo');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('listbox');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await expect(trigger).not.toHaveTextContent('Escolha…');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Invalid: Story = {
  render: () => <TypeSelect error="Escolha o tipo da conta." />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByLabelText('Tipo');
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await expect(trigger).toHaveAccessibleDescription('Escolha o tipo da conta.');
  },
};

export const Disabled: Story = {
  render: () => <TypeSelect disabled />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('Tipo')).toBeDisabled();
  },
};
