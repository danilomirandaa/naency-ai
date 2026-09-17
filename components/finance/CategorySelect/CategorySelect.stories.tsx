import { CategorySelect } from '@/components/finance/CategorySelect';
import { Field } from '@/components/ui/Input';
import { categoriesFixture, categoryFixtureId } from '@/features/categories/fixtures/categories';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof CategorySelect> = {
  title: 'Finance/CategorySelect',
  component: CategorySelect,
  args: { categories: categoriesFixture, kind: 'expense', onValueChange: fn() },
  render: (args) => (
    <form className="max-w-xs" onSubmit={(event) => event.preventDefault()}>
      <Field label="Categoria">{(control) => <CategorySelect {...control} {...args} name="categoryId" />}</Field>
    </form>
  ),
};

export default meta;

type Story = StoryObj<typeof CategorySelect>;

function formValue(canvasElement: HTMLElement) {
  return new FormData(canvasElement.querySelector('form') ?? undefined).get('categoryId');
}

export const PickSubcategory: Story = {
  play: async ({ canvasElement, args }) => {
    const trigger = within(canvasElement).getByLabelText('Categoria');
    await expect(trigger).toHaveTextContent('Sem categoria');
    await expect(formValue(canvasElement)).toBe('');

    await userEvent.click(trigger);
    const listbox = within(await screen.findByRole('listbox'));
    // Só despesas.
    await expect(listbox.queryByRole('option', { name: 'Salário' })).toBeNull();
    await userEvent.click(listbox.getByRole('option', { name: 'Aluguel' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());

    await expect(trigger).toHaveTextContent('Aluguel');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(categoryFixtureId('Moradia/Aluguel'));
    await expect(formValue(canvasElement)).toBe(categoryFixtureId('Moradia/Aluguel'));
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Income: Story = {
  args: { kind: 'income', defaultValue: categoryFixtureId('Salário', 'income') },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('Categoria')).toHaveTextContent('Salário');
    await expect(formValue(canvasElement)).toBe(categoryFixtureId('Salário', 'income'));
  },
};

export const ClearToNone: Story = {
  args: { defaultValue: categoryFixtureId('Mercado') },
  play: async ({ canvasElement, args }) => {
    const trigger = within(canvasElement).getByLabelText('Categoria');
    await userEvent.click(trigger);
    await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'Sem categoria' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
    await expect(formValue(canvasElement)).toBe('');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const WithoutNoneOption: Story = {
  args: { noneLabel: null, placeholder: 'Escolha a categoria' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('Categoria')).toHaveTextContent('Escolha a categoria');
  },
};

export const BothKindsForFilters: Story = {
  args: { kind: null, noneLabel: 'Todas as categorias' },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByLabelText('Categoria');
    await expect(trigger).toHaveTextContent('Todas as categorias');
    await userEvent.click(trigger);
    const listbox = within(await screen.findByRole('listbox'));
    await expect(listbox.getByRole('option', { name: 'Salário' })).toBeInTheDocument();
    await expect(listbox.getByRole('option', { name: 'Mercado' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** Lista aberta e sem play: o screenshot cobre o alinhamento de ícone, nome e subcategorias. */
export const OpenList: Story = {
  args: { defaultOpen: true },
  parameters: {
    // Falsos positivos do estado aberto do Radix, só nesta story: o resto da página
    // fica aria-hidden com o foco preso na lista, e a lista rola com as setas
    // (roving focus), não com Tab.
    a11y: {
      config: {
        rules: [
          { id: 'aria-hidden-focus', enabled: false },
          { id: 'scrollable-region-focusable', enabled: false },
        ],
      },
    },
  },
  play: async () => {
    const listbox = within(await screen.findByRole('listbox'));
    const option = listbox.getByRole('option', { name: 'Alimentação' });
    const icon = option.querySelector('[data-slot="category-icon"]');
    const label = [...option.querySelectorAll('span')].find((node) => node.textContent === 'Alimentação');
    // Ícone e nome na mesma linha.
    await expect(icon?.getBoundingClientRect().top).toBeLessThan(label?.getBoundingClientRect().bottom ?? 0);
    await expect(
      Math.abs((icon?.getBoundingClientRect().top ?? 0) - (option.getBoundingClientRect().top ?? 0)),
    ).toBeLessThan(12);
  },
};
