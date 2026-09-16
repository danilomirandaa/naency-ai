import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  framework: '@storybook/nextjs-vite',
  stories: ['../{components,features}/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-themes',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  staticDirs: ['../public'],
};

export default config;
