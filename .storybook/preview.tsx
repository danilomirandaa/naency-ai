import '@fontsource-variable/inter';
import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview } from '@storybook/nextjs-vite';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    // Violação de acessibilidade reprova o teste da story (docs/testing.md).
    a11y: { test: 'error' },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
  ],
};

export default preview;
