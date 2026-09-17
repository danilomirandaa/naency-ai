import { defineConfig, devices } from '@playwright/test';

/**
 * Regressão visual: screenshot de cada story (light e dark) comparado com o
 * baseline commitado. Baselines válidos são os de Linux, gerados na CI
 * (docs/testing.md); os de macOS ficam só na máquina, fora do git.
 */
export default defineConfig({
  testDir: 'tests/visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  // Na CI um baseline ausente é erro; localmente ele é criado.
  updateSnapshots: process.env.CI ? 'none' : 'missing',
  expect: {
    // Timeout maior: sob carga (ou em runner lento) duas capturas iguais seguidas
    // podem levar mais que os 5s padrão.
    timeout: 15_000,
    toHaveScreenshot: { animations: 'disabled', caret: 'hide' },
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:6007',
    viewport: { width: 1280, height: 800 },
    colorScheme: 'light',
  },
  webServer: {
    command: 'npx http-server storybook-static -p 6007 -s',
    url: 'http://127.0.0.1:6007/index.json',
    reuseExistingServer: !process.env.CI,
  },
});
