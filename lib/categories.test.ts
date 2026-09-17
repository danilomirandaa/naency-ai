import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  DEFAULT_CATEGORIES,
  buildCategoryTree,
  categoryPath,
} from './categories';

describe('DEFAULT_CATEGORIES', () => {
  it('usa só ícones e cores da paleta', () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(CATEGORY_ICONS).toContain(category.icon);
      expect(CATEGORY_COLORS).toContain(category.color);
    }
  });

  it('não repete nome dentro do mesmo tipo e nível', () => {
    for (const kind of ['expense', 'income'] as const) {
      const names = DEFAULT_CATEGORIES.filter((c) => c.kind === kind).map((c) => c.name);
      expect(new Set(names).size).toBe(names.length);
    }
    for (const category of DEFAULT_CATEGORIES) {
      const children = category.children ?? [];
      expect(new Set(children).size).toBe(children.length);
    }
  });

  it('as migrations que semeiam espaços existentes cobrem exatamente a lista padrão', () => {
    const dir = 'server/db/migrations';
    const sql = readdirSync(dir)
      .filter((name) => /seed_default_(sub)?categories/.test(name))
      .map((name) => readFileSync(path.join(dir, name), 'utf8'))
      .join('\n');
    const expected = DEFAULT_CATEGORIES.flatMap((category) => [
      `${category.kind}|${category.name}|`,
      ...(category.children ?? []).map((child) => `${category.kind}|${child}|${category.name}`),
    ]).sort();
    // Linhas com (nome, tipo, ícone, cor, pai|NULL) ou, só nas subcategorias novas, (pai, tipo, nome).
    const full = [...sql.matchAll(/^\s*\('([^']*)', '(expense|income)', 'category-[a-z-]+', '#[0-9A-F]{6}', (?:NULL|'([^']*)')\),?$/gm)].map(
      (match) => `${match[2]}|${match[1]}|${match[3] ?? ''}`,
    );
    const short = [...sql.matchAll(/^\s*\('([^']*)', '(expense|income)', '([^']*)'\),?$/gm)].map(
      (match) => `${match[2]}|${match[3]}|${match[1]}`,
    );
    const roots = full;
    const children = short;
    expect([...roots, ...children].sort()).toEqual(expected);
  });
});

describe('buildCategoryTree', () => {
  const flat = [
    { id: 'moradia', parentId: null, name: 'Moradia' },
    { id: 'aluguel', parentId: 'moradia', name: 'Aluguel' },
    { id: 'mercado', parentId: null, name: 'Mercado' },
    { id: 'orfa', parentId: 'sumiu', name: 'Órfã' },
    { id: 'energia', parentId: 'moradia', name: 'Energia' },
  ];

  it('agrupa subcategorias no pai, na ordem recebida, e descarta órfãs', () => {
    expect(buildCategoryTree(flat)).toEqual([
      {
        ...flat[0],
        children: [flat[1], flat[4]],
      },
      { ...flat[2], children: [] },
    ]);
  });

  it('monta o caminho com o pai', () => {
    const byId = new Map(flat.map((category) => [category.id, category]));
    expect(categoryPath(flat[1] as (typeof flat)[number], byId)).toBe('Moradia › Aluguel');
    expect(categoryPath(flat[2] as (typeof flat)[number], byId)).toBe('Mercado');
  });
});
