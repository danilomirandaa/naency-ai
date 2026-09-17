import { CategoryStylePicker } from '@/features/categories/components/CategoryStylePicker';
import type { CategoryIconName } from '@/lib/categories';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof CategoryStylePicker> = {
  title: 'Features/Categories/CategoryStylePicker',
  component: CategoryStylePicker,
};

export default meta;

type Story = StoryObj<typeof CategoryStylePicker>;

function Demo() {
  const [icon, setIcon] = React.useState<CategoryIconName>('category-home');
  const [color, setColor] = React.useState('#6366F1');
  return (
    <form className="max-w-md" onSubmit={(event) => event.preventDefault()}>
      <CategoryStylePicker icon={icon} color={color} onIconChange={setIcon} onColorChange={setColor} />
    </form>
  );
}

export const PickIconAndColor: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const icons = canvas.getByRole('radiogroup', { name: 'Ícone' });
    const colors = canvas.getByRole('radiogroup', { name: 'Cor' });
    await expect(within(icons).getByRole('radio', { name: 'Casa' })).toBeChecked();

    await userEvent.click(within(icons).getByRole('radio', { name: 'Pets' }));
    await userEvent.click(within(colors).getByRole('radio', { name: 'Cor 12' }));
    await expect(within(icons).getByRole('radio', { name: 'Pets' })).toBeChecked();

    const data = new FormData(canvasElement.querySelector('form') ?? undefined);
    await expect(data.get('icon')).toBe('category-pets');
    await expect(data.get('color')).toBe('#92400E');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
