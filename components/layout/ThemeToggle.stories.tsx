import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Layout/ThemeToggle',
  component: ThemeToggle,
};

export default meta;

type Story = StoryObj<typeof ThemeToggle>;

async function chooseTheme(canvasElement: HTMLElement, label: string) {
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Alterar tema' }));
  await userEvent.click(await screen.findByRole('menuitemradio', { name: label }));
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const initialDark = root.classList.contains('dark');
    const initialStored = localStorage.getItem(THEME_STORAGE_KEY);

    try {
      await chooseTheme(canvasElement, 'Escuro');
      await expect(root).toHaveClass('dark');
      await expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

      await chooseTheme(canvasElement, 'Claro');
      await expect(root).not.toHaveClass('dark');
      await expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    } finally {
      // Devolve o estado do Storybook (o tema da story vem do addon-themes).
      if (initialStored === null) {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, initialStored);
      }
      root.classList.toggle('dark', initialDark);
      root.style.colorScheme = '';
    }
  },
};
