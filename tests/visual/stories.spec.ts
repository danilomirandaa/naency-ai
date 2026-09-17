import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

type IndexEntry = {
  id: string;
  type: 'story' | 'docs';
  title: string;
  name: string;
  tags?: string[];
};

// Lista gerada pelo `npm run build-storybook`. Story nova entra aqui sozinha.
const index = JSON.parse(readFileSync('storybook-static/index.json', 'utf8')) as {
  entries: Record<string, IndexEntry>;
};

const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && !entry.tags?.includes('skip-visual'),
);

const themes = ['light', 'dark'] as const;

for (const story of stories) {
  for (const theme of themes) {
    test(`${story.title} › ${story.name} › ${theme}`, async ({ page }) => {
      await page.goto(
        `/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`,
      );

      // Espera renderizar e terminar o `play` da story.
      const phase = await page.waitForFunction(() => {
        const preview = (
          window as unknown as {
            __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
          }
        ).__STORYBOOK_PREVIEW__;
        const current = preview?.currentRender?.phase;
        return current === 'finished' || current === 'errored' ? current : false;
      });
      expect(await phase.jsonValue(), 'a story falhou ao renderizar ou no play').toBe(
        'finished',
      );
      await page.evaluate(() => document.fonts.ready);
      // O anel de foco (:focus-visible) nem sempre aparece após interações do
      // play, e dialogs devolvem o foco ao fechar: tira o foco para o screenshot
      // ser determinístico.
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

      await expect(page).toHaveScreenshot(`${story.id}--${theme}.png`, {
        fullPage: true,
      });
    });
  }
}
