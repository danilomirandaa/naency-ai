import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@': dirname },
  },
  test: {
    projects: [
      {
        // Lógica pura: *.test.ts ao lado do arquivo testado.
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['{lib,hooks,components,features,server}/**/*.test.{ts,tsx}'],
          exclude: ['**/*.integration.test.ts', 'node_modules/**'],
        },
      },
      {
        // DAL contra Postgres real (PGlite, em memória) com as migrations do projeto.
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['server/**/*.integration.test.ts'],
          setupFiles: ['tests/integration/setup.ts'],
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
      {
        // Cada story vira um teste: renderiza, roda o `play` e checa acessibilidade.
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
        test: {
          name: 'storybook',
          // Arquivos em paralelo compartilham a mesma aba do navegador e disputam
          // foco/teclado (hover, digitação, Escape), o que deixa testes instáveis.
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
            // Desktop por padrão: abaixo de 768px a Sidebar vira o menu mobile.
            viewport: { width: 1280, height: 800 },
          },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['lib/**', 'server/import/**', 'server/dal/**', 'server/invitations/**', 'server/auth/**'],
      exclude: ['**/*.test.ts', '**/*.integration.test.ts'],
      thresholds: { lines: 90 },
    },
  },
});
