import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Link from 'next/link';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  args: { onClick: fn(), children: 'Botão' },
};

export default meta;

type Story = StoryObj<typeof Button>;

const VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const;
const SIZES = ['xs', 'sm', 'default', 'lg'] as const;
const ICON_SIZES = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const;

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'outline' }));
    await expect(args.onClick).toHaveBeenCalledOnce();
    await expect(canvas.getByRole('button', { name: 'default' })).toHaveAttribute('type', 'button');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {SIZES.map((size) => (
          <Button key={size} {...args} size={size}>
            <Icon icon="add" data-icon="inline-start" />
            Tamanho {size}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {ICON_SIZES.map((size) => (
          <Button key={size} {...args} variant="outline" size={size} aria-label={`Editar (${size})`}>
            <Icon icon="edit" />
          </Button>
        ))}
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Tamanho lg' })).toHaveAttribute('data-size', 'lg');
    await expect(canvas.getByRole('button', { name: 'Editar (icon-sm)' })).toBeInTheDocument();
  },
};

export const IconAtEnd: Story = {
  args: { size: 'lg' },
  render: (args) => (
    <Button {...args}>
      Continuar
      <Icon icon="arrow-right" data-icon="inline-end" />
    </Button>
  ),
};

export const Loading: Story = {
  render: (args) => (
    <Button {...args} disabled>
      <Spinner label={null} data-icon="inline-start" />
      Salvando…
    </Button>
  ),
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Salvando…' });
    await expect(button).toBeDisabled();
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const AsLink: Story = {
  render: () => (
    <Button asChild variant="outline">
      <Link href="/contas">Ver contas</Link>
    </Button>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Ver contas' });
    await expect(link).toHaveAttribute('href', '/contas');
    await expect(link).toHaveAttribute('data-slot', 'button');
    await expect(link).not.toHaveAttribute('type');
  },
};

export const SubmitsForm: Story = {
  render: () => {
    const onSubmit = fn((event: React.FormEvent) => event.preventDefault());
    return (
      <form onSubmit={onSubmit} data-testid="form">
        <Button type="submit">Enviar</Button>
        <Button variant="outline" className="ml-2">
          Não envia
        </Button>
      </form>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    let submitted = 0;
    canvas.getByTestId('form').addEventListener('submit', (event) => {
      event.preventDefault();
      submitted += 1;
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Não envia' }));
    await expect(submitted).toBe(0);
    await userEvent.click(canvas.getByRole('button', { name: 'Enviar' }));
    await expect(submitted).toBe(1);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
