import { Button } from '@/components/ui/Button';
import { CategoryFormDialog } from '@/features/categories/components/CategoryFormDialog';
import { categoriesFixture, categoryFixtureId } from '@/features/categories/fixtures/categories';
import { type CategoryFormState, parseCategoryForm } from '@/features/categories/schemas';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

async function fakeSave(_state: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const parsed = parseCategoryForm(formData);
  if (!('success' in parsed)) {
    return parsed;
  }
  if (parsed.data.name.toLowerCase() === 'mercado') {
    return {
      status: 'error',
      message: 'Já existe uma categoria com esse nome aqui.',
      fieldErrors: { name: 'Já existe uma categoria com esse nome aqui.' },
      values: { ...parsed.data, parentId: parsed.data.parentId ?? '' },
    };
  }
  return { status: 'saved', categoryId: 'nova' };
}

const meta: Meta<typeof CategoryFormDialog> = {
  title: 'Features/Categories/CategoryFormDialog',
  component: CategoryFormDialog,
  args: {
    kind: 'expense',
    categories: categoriesFixture,
    action: fn(fakeSave),
    onSaved: fn(),
  },
  render: function Render(args) {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir</Button>
        <CategoryFormDialog {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
};

export default meta;

type Story = StoryObj<typeof CategoryFormDialog>;

async function openDialog(canvasElement: HTMLElement, name: string) {
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Abrir' }));
  return within(await screen.findByRole('dialog', { name }));
}

function lastFormData(action: unknown) {
  const calls = (action as ReturnType<typeof fn>).mock.calls;
  return Object.fromEntries(calls[calls.length - 1]?.[1] as FormData);
}

export const CreateSubcategory: Story = {
  args: { defaultParentId: categoryFixtureId('Saúde') },
  play: async ({ canvasElement, args }) => {
    const dialog = await openDialog(canvasElement, 'Nova categoria de despesa');
    await expect(dialog.getByLabelText('Dentro de')).toHaveTextContent('Saúde');
    await userEvent.type(dialog.getByLabelText('Nome'), 'Dentista');
    await userEvent.click(dialog.getByRole('radio', { name: 'Saúde' }));
    await userEvent.click(dialog.getByRole('button', { name: 'Criar categoria' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(args.onSaved).toHaveBeenCalledWith('nova');
    await expect(lastFormData(args.action)).toEqual({
      kind: 'expense',
      name: 'Dentista',
      parentId: categoryFixtureId('Saúde'),
      icon: 'category-health',
      color: '#6366F1',
    });
  },
};

export const DuplicateKeepsValues: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement, 'Nova categoria de despesa');
    await userEvent.type(dialog.getByLabelText('Nome'), 'Mercado');
    await userEvent.click(dialog.getByRole('radio', { name: 'Pets' }));
    await userEvent.click(dialog.getByRole('button', { name: 'Criar categoria' }));

    await expect(await dialog.findByRole('alert')).toHaveTextContent('Já existe');
    await expect(dialog.getByLabelText('Nome')).toHaveValue('Mercado');
    await expect(dialog.getByRole('radio', { name: 'Pets' })).toBeChecked();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const EditParentWithChildren: Story = {
  args: { category: categoriesFixture.find((category) => category.id === categoryFixtureId('Moradia')) },
  play: async ({ canvasElement, args }) => {
    const dialog = await openDialog(canvasElement, 'Editar categoria');
    await expect(dialog.getByLabelText('Nome')).toHaveValue('Moradia');
    const parent = dialog.getByLabelText('Dentro de');
    await expect(parent).toBeDisabled();
    await expect(parent).toHaveAccessibleDescription('Tem subcategorias, então continua como principal.');
    await expect(dialog.getByRole('radio', { name: 'Casa' })).toBeChecked();

    await userEvent.clear(dialog.getByLabelText('Nome'));
    await userEvent.type(dialog.getByLabelText('Nome'), 'Casa');
    await userEvent.click(dialog.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(lastFormData(args.action)).toMatchObject({ name: 'Casa', parentId: '', color: '#6366F1' });
  },
};
