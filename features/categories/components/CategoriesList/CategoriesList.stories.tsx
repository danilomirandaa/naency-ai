import { CategoriesList } from '@/features/categories/components/CategoriesList';
import { categoriesFixture, categoryFixtureId } from '@/features/categories/fixtures/categories';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

const withArchived = categoriesFixture.map((category) =>
  category.id === categoryFixtureId('Pets') ? { ...category, archived: true } : category,
);

const meta: Meta<typeof CategoriesList> = {
  title: 'Features/Categories/CategoriesList',
  component: CategoriesList,
  args: {
    categories: withArchived,
    kind: 'expense',
    canEdit: true,
    onCreate: fn(),
    onEdit: fn(),
    onArchiveChange: fn(async () => {}),
    onRetry: fn(),
  },
  render: (args) => (
    <div className="flex max-w-2xl flex-col gap-4">
      <CategoriesList {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof CategoriesList>;

export const ExpensesEditor: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const list = within(canvas.getByRole('list', { name: 'Categorias de despesa' }));
    await expect(list.getByText('13 subcategorias')).toBeInTheDocument();
    await expect(list.queryByText('Salário')).toBeNull();
    await expect(list.queryByText('Pets')).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Nova subcategoria em Moradia' }));
    await expect(args.onCreate).toHaveBeenCalledWith(categoryFixtureId('Moradia'));

    await userEvent.click(canvas.getByRole('button', { name: 'Editar Aluguel' }));
    await expect(args.onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: categoryFixtureId('Moradia/Aluguel') }));

    const archived = within(canvas.getByRole('list', { name: 'Categorias de despesa arquivadas' }));
    await userEvent.click(archived.getByRole('button', { name: 'Desarquivar Pets' }));
    await expect(args.onArchiveChange).toHaveBeenCalledWith(expect.objectContaining({ id: categoryFixtureId('Pets') }), false);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const IncomeViewer: Story = {
  args: { kind: 'income', canEdit: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = within(canvas.getByRole('list', { name: 'Categorias de receita' }));
    await expect(list.getAllByRole('listitem')).toHaveLength(13);
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

export const Empty: Story = {
  args: { categories: [] },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Nova categoria' }));
    await expect(args.onCreate).toHaveBeenCalledWith(null);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Loading: Story = {
  args: { categories: [], isLoading: true },
};

export const LoadError: Story = {
  args: { categories: [], isError: true },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Tentar de novo' }));
    await expect(args.onRetry).toHaveBeenCalledOnce();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
