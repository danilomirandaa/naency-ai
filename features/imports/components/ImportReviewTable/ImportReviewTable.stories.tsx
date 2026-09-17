import { categoriesFixture, categoryFixtureId } from '@/features/categories/fixtures/categories';
import { ImportReviewTable } from '@/features/imports/components/ImportReviewTable';
import { importBatchFixture } from '@/features/imports/fixtures/imports';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof ImportReviewTable> = {
  title: 'Features/Imports/ImportReviewTable',
  component: ImportReviewTable,
  args: { rows: importBatchFixture.rows, categories: categoriesFixture, onRowChange: fn() },
  render: (args) => (
    <div className="max-w-4xl">
      <ImportReviewTable {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof ImportReviewTable>;

export const Review: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const [padaria, salario, pix] = importBatchFixture.rows;
    await expect(canvas.getByText('Categoria lembrada')).toBeInTheDocument();
    await expect(canvas.getByText('Possível duplicado')).toBeInTheDocument();
    await expect(canvas.getByRole('checkbox', { name: 'Incluir Pix enviado - Maria' })).not.toBeChecked();
    await expect(canvas.getByLabelText('Categoria de Pix enviado - Maria')).toBeDisabled();

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Incluir Pix enviado - Maria' }));
    await expect(args.onRowChange).toHaveBeenLastCalledWith(pix, { include: true });

    await userEvent.click(canvas.getByLabelText('Categoria de Transferência recebida - EMPRESA LTDA'));
    const listbox = within(await screen.findByRole('listbox'));
    await expect(listbox.queryByRole('option', { name: 'Mercado' })).toBeNull();
    await userEvent.click(listbox.getByRole('option', { name: 'Salário' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await expect(args.onRowChange).toHaveBeenLastCalledWith(salario, {
      categoryId: categoryFixtureId('Salário', 'income'),
    });
    await expect(padaria).toBeDefined();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const RememberCategory: Story = {
  args: {
    rows: [{ ...(importBatchFixture.rows[1] as (typeof importBatchFixture.rows)[number]), categoryId: categoryFixtureId('Salário', 'income') }],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Lembrar para os próximos' }));
    await expect(args.onRowChange).toHaveBeenCalledWith(expect.anything(), { rememberCategory: true });
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const ReadOnly: Story = {
  args: { readOnly: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const checkbox of canvas.getAllByRole('checkbox')) {
      await expect(checkbox).toBeDisabled();
    }
  },
};
