'use client';

import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  type Theme,
  isTheme,
} from '@/lib/theme';
import { useCallback, useSyncExternalStore } from 'react';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const listeners = new Set<() => void>();
// Fallback quando localStorage não está disponível (ex.: navegação privada).
let memoryTheme: Theme | null = null;

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return memoryTheme ?? DEFAULT_THEME;
  }
}

function applyTheme(theme: Theme) {
  const resolved =
    theme === 'system'
      ? window.matchMedia(DARK_QUERY).matches
        ? 'dark'
        : 'light'
      : theme;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const mql = window.matchMedia(DARK_QUERY);
  const handleSystemChange = () => {
    if (readTheme() === 'system') {
      applyTheme('system');
    }
  };
  // Troca feita em outra aba.
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      applyTheme(readTheme());
      notify();
    }
  };

  mql.addEventListener('change', handleSystemChange);
  window.addEventListener('storage', handleStorage);

  return () => {
    listeners.delete(listener);
    mql.removeEventListener('change', handleSystemChange);
    window.removeEventListener('storage', handleStorage);
  };
}

/**
 * Preferência de tema do usuário. No servidor devolve o padrão (`system`);
 * a classe `.dark` já foi aplicada pelo script do <head>, então só a UI que
 * mostra a opção selecionada atualiza após a hidratação.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      memoryTheme = next;
    }
    applyTheme(next);
    notify();
  }, []);

  return { theme, setTheme };
}
