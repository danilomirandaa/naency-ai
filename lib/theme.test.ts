import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY, isTheme, themeScript } from './theme';

describe('isTheme', () => {
  it.each(['light', 'dark', 'system'])('aceita "%s"', (value) => {
    expect(isTheme(value)).toBe(true);
  });

  it.each([null, undefined, '', 'Dark', 'blue', 1])('rejeita %s', (value) => {
    expect(isTheme(value)).toBe(false);
  });
});

describe('themeScript', () => {
  type FakeDocument = {
    documentElement: { classList: Set<string> & { toggle: (c: string, on: boolean) => void }; style: { colorScheme?: string } };
  };

  function run(stored: string | null, prefersDark: boolean) {
    const classList = new Set<string>() as FakeDocument['documentElement']['classList'];
    classList.toggle = (name, on) => {
      if (on) classList.add(name);
      else classList.delete(name);
    };
    const document: FakeDocument = { documentElement: { classList, style: {} } };
    const localStorage = { getItem: (key: string) => (key === THEME_STORAGE_KEY ? stored : null) };
    const matchMedia = () => ({ matches: prefersDark });
    new Function('document', 'localStorage', 'matchMedia', themeScript)(
      document,
      localStorage,
      matchMedia,
    );
    return document.documentElement;
  }

  it('usa a preferência salva, ignorando o sistema', () => {
    expect(run('dark', false).classList.has('dark')).toBe(true);
    expect(run('light', true).classList.has('dark')).toBe(false);
  });

  it('sem preferência salva ou com "system", segue o sistema', () => {
    expect(run(null, true).classList.has('dark')).toBe(true);
    expect(run('system', false).classList.has('dark')).toBe(false);
  });

  it('define o color-scheme resolvido', () => {
    expect(run('system', true).style.colorScheme).toBe('dark');
    expect(run('light', true).style.colorScheme).toBe('light');
  });

  it('não quebra a página se o localStorage lançar erro', () => {
    expect(() =>
      new Function('document', 'localStorage', 'matchMedia', themeScript)(
        { documentElement: { classList: new Set(), style: {} } },
        { getItem: () => { throw new Error('bloqueado'); } },
        () => ({ matches: false }),
      ),
    ).not.toThrow();
  });
});
