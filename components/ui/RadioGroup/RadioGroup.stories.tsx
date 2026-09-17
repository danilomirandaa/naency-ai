import { RadioGroup } from '@/components/ui/RadioGroup';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof RadioGroup.Root> = {
  title: 'Design System/RadioGroup',
  component: RadioGroup.Root,
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof RadioGroup.Root>;

export const Cards: Story = {
  render: () => (
    <RadioGroup.Root aria-label="Papel" name="role" defaultValue="editor">
      <RadioGroup.Card value="editor" label="Editor" description="Lança, edita e importa extratos." />
      <RadioGroup.Card value="viewer" label="Leitor" description="Só acompanha, sem editar." />
      <RadioGroup.Card value="admin" label="Administrador" description="Indisponível aqui." disabled />
    </RadioGroup.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = canvas.getByRole('radio', { name: 'Editor' });
    const viewer = canvas.getByRole('radio', { name: 'Leitor' });
    await expect(editor).toBeChecked();
    await expect(viewer).toHaveAccessibleDescription('Só acompanha, sem editar.');

    // Clicar no texto do cartão seleciona.
    await userEvent.click(canvas.getByText('Só acompanha, sem editar.'));
    await expect(viewer).toBeChecked();

    // Setas do teclado navegam entre opções habilitadas.
    viewer.focus();
    // O Radix move o foco num setTimeout e só marca a opção se a seta ainda estiver
    // pressionada ao focar; `>` segura a tecla, como uma pessoa faria.
    await userEvent.keyboard('{ArrowUp>}');
    await waitFor(() => expect(editor).toBeChecked());
    await userEvent.keyboard('{/ArrowUp}');
    await expect(canvas.getByRole('radio', { name: 'Administrador' })).toBeDisabled();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
