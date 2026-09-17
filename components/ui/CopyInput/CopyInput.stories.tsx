import { CopyInput } from '@/components/ui/CopyInput';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, spyOn, userEvent, within } from 'storybook/test';

const meta: Meta<typeof CopyInput> = {
  title: 'Design System/CopyInput',
  component: CopyInput,
  args: {
    'aria-label': 'Link do convite',
    value: 'https://naency.app/convite/Qm9hIHRlbnRhdGl2YSwgbWFzIG7Do28gw6kgdW0gdG9rZW4',
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof CopyInput>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const writeText = spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    await userEvent.click(canvas.getByRole('button', { name: 'Copiar' }));
    await expect(writeText).toHaveBeenCalledWith(args.value);
    await expect(await canvas.findByRole('button', { name: 'Copiado' })).toBeVisible();
    writeText.mockRestore();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const ClipboardBlocked: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const writeText = spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('negado'));
    await userEvent.click(canvas.getByRole('button', { name: 'Copiar' }));
    await expect(await canvas.findByRole('button', { name: 'Selecione e copie' })).toBeVisible();
    writeText.mockRestore();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
