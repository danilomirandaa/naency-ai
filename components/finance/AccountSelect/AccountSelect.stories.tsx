import { AccountSelect } from '@/components/finance/AccountSelect';
import { Field } from '@/components/ui/Input';
import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof AccountSelect> = {
  title: 'Finance/AccountSelect',
  component: AccountSelect,
  args: { accounts: accountsFixture, onValueChange: fn() },
  render: (args) => (
    <form className="max-w-xs" onSubmit={(event) => event.preventDefault()}>
      <Field label="Conta">{(control) => <AccountSelect {...control} {...args} name="accountId" />}</Field>
    </form>
  ),
};

export default meta;

type Story = StoryObj<typeof AccountSelect>;

function formValue(canvasElement: HTMLElement) {
  return new FormData(canvasElement.querySelector('form') ?? undefined).get('accountId');
}

export const PickAccount: Story = {
  play: async ({ canvasElement, args }) => {
    const trigger = within(canvasElement).getByLabelText('Conta');
    await expect(trigger).toHaveTextContent('Escolha a conta');
    await userEvent.click(trigger);
    const listbox = within(await screen.findByRole('listbox'));
    // Arquivada não aparece para escolha nova.
    await expect(listbox.queryByRole('option', { name: /Conta antiga/ })).toBeNull();
    await userEvent.click(listbox.getByRole('option', { name: /Carteira/ }));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await expect(args.onValueChange).toHaveBeenLastCalledWith('0000000a-0000-4000-8000-000000000003');
    await expect(formValue(canvasElement)).toBe('0000000a-0000-4000-8000-000000000003');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const FilterWithAll: Story = {
  args: { allLabel: 'Todas as contas' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('Conta')).toHaveTextContent('Todas as contas');
  },
};

export const ExcludesOrigin: Story = {
  args: { excludeId: '0000000a-0000-4000-8000-000000000001', defaultValue: '0000000a-0000-4000-8000-000000000004' },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByLabelText('Conta');
    // A arquivada já escolhida continua visível.
    await expect(trigger).toHaveTextContent('Conta antiga');
    await userEvent.click(trigger);
    const listbox = within(await screen.findByRole('listbox'));
    await expect(listbox.queryByRole('option', { name: /Nubank/ })).toBeNull();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
