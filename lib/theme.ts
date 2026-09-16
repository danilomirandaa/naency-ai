/**
 * Tema claro/escuro. Sem 'use client': o script inline é renderizado no
 * <head> pelo layout do servidor e aplica a classe `.dark` antes da primeira
 * pintura, evitando piscar no tema errado.
 */

export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = 'naency-theme';
export const DEFAULT_THEME: Theme = 'system';

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/** Mesma lógica de `applyTheme` (hooks/useTheme.ts), serializada para o <head>. */
export const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var r=document.documentElement;r.classList.toggle("dark",t==="dark");r.style.colorScheme=t}catch(e){}})()`;
