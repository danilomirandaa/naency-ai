import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Componente sem 'use client' pode rodar no servidor. Lá, cada export de um
 * módulo 'use client' vira uma referência opaca: `<Avatar.Root>` chega
 * undefined e a página quebra em runtime ("Element type is invalid"). O
 * Storybook roda tudo no navegador e não pega esse erro; este teste pega.
 */
const ROOTS = ['app', 'components', 'features'];

function listTsx(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listTsx(full);
    }
    return entry.name.endsWith('.tsx') && !entry.name.includes('.stories.') ? [full] : [];
  });
}

function isClientModule(file: string) {
  return /^\s*['"]use client['"]/.test(readFileSync(file, 'utf8'));
}

function resolveImport(specifier: string, from: string) {
  let base: string;
  if (specifier.startsWith('@/')) {
    base = specifier.slice(2);
  } else if (specifier.startsWith('.')) {
    base = path.join(path.dirname(from), specifier);
  } else {
    return null;
  }
  const candidates = [`${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

export function findCompoundAccessAcrossBoundary(files: string[]) {
  const problems: string[] = [];
  for (const file of files) {
    if (isClientModule(file)) {
      continue;
    }
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/import\s+\{([^}]*)\}\s+from\s+'([^']+)'/g)) {
      const target = resolveImport(match[2] ?? '', file);
      if (!target || !isClientModule(target)) {
        continue;
      }
      const names = (match[1] ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name && !name.startsWith('type '))
        .map((name) => name.split(/\s+as\s+/).pop() ?? name);
      for (const name of names) {
        if (new RegExp(`<${name}\\.[A-Z]`).test(source)) {
          problems.push(`${file}: <${name}.…> vem de ${target} ('use client')`);
        }
      }
    }
  }
  return problems;
}

describe('fronteira servidor/cliente', () => {
  it('componentes que podem rodar no servidor não usam objeto composto de módulo client', () => {
    const files = ROOTS.flatMap((root) => listTsx(root));
    expect(files.length).toBeGreaterThan(50);
    expect(findCompoundAccessAcrossBoundary(files)).toEqual([]);
  });

  it('detecta o caso que quebrou /membros', () => {
    const fixture = path.join('tests/architecture/__fixtures__/ServerAvatar.tsx');
    expect(findCompoundAccessAcrossBoundary([fixture])).toEqual([
      `${fixture}: <Avatar.…> vem de components/ui/Avatar/index.tsx ('use client')`,
    ]);
  });
});
