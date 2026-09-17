import { MoneyCalculator } from '@/components/finance/MoneyCalculator';
import { MoneyInput } from '@/components/finance/MoneyInput';
import { Field } from '@/components/ui/Input';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta = { title: 'Finance/MoneyCalculator' };
export default meta;
type Story = StoryObj;

const onApply = fn();

export const Keypad: Story = {
  render: () => <MoneyCalculator initialCents={23_000} onApply={onApply} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const display = canvas.getByLabelText('Conta');
    await expect(display).toHaveTextContent('230');
    await userEvent.click(canvas.getByRole('button', { name: 'Somar' }));
    await userEvent.click(canvas.getByRole('button', { name: '4' }));
    await userEvent.click(canvas.getByRole('button', { name: '5' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Multiplicar' }));
    await userEvent.click(canvas.getByRole('button', { name: '2' }));
    await expect(display).toHaveTextContent('230+45×2');
    await userEvent.click(canvas.getByRole('button', { name: 'Igual' }));
    await expect(display).toHaveTextContent('320');
    await userEvent.click(canvas.getByRole('button', { name: /Copiar/ }));
    await expect(onApply).toHaveBeenCalledWith(32_000);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Keyboard: Story = {
  render: () => <MoneyCalculator initialCents={null} onApply={onApply} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole('group', { name: 'Calculadora' })).toHaveFocus());
    await userEvent.keyboard('100/4{Enter}');
    await expect(canvas.getByLabelText('Conta')).toHaveTextContent('25');
    await userEvent.keyboard('{Backspace}{Backspace}12,5');
    await expect(canvas.getByLabelText('Conta')).toHaveTextContent('12,5');
    await userEvent.keyboard('{Meta>}{Enter}{/Meta}');
    await expect(onApply).toHaveBeenLastCalledWith(1_250);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const InMoneyInput: Story = {
  render: () => (
    <form className="max-w-xs" onSubmit={(event) => event.preventDefault()}>
      <Field label="Valor">{(control) => <MoneyInput {...control} name="amount" calculator defaultValue={23_000} />}</Field>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Abrir calculadora' }));
    const calculator = within(await screen.findByRole('group', { name: 'Calculadora' }));
    await userEvent.click(calculator.getByRole('button', { name: 'Dividir' }));
    await userEvent.click(calculator.getByRole('button', { name: '2' }));
    await userEvent.click(calculator.getByRole('button', { name: /Copiar/ }));
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Calculadora' })).toBeNull());
    await expect(canvas.getByLabelText('Valor')).toHaveValue('115,00');
    const hidden = canvasElement.querySelector<HTMLInputElement>('input[name="amount"]');
    await expect(hidden?.value).toBe('11500');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
