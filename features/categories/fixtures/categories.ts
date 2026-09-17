import type { CategorySummary } from '@/features/categories/types';
import { DEFAULT_CATEGORIES } from '@/lib/categories';

function slug(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

/** UUID determinístico a partir de uma chave legível ("expense-moradia"). */
function fixtureUuid(key: string) {
  let hash = 0;
  for (const char of key) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 0xffffffffffff;
  }
  return `00000000-0000-4000-8000-${hash.toString(16).padStart(12, '0')}`;
}

/** Id da categoria de exemplo pelo nome ("Moradia") ou caminho ("Moradia/Aluguel"). */
export function categoryFixtureId(path: string, kind: 'expense' | 'income' = 'expense') {
  return fixtureUuid(`${kind}-${path.split('/').map(slug).join('-')}`);
}

/** Categorias padrão com UUIDs estáveis, para stories e testes. */
export const categoriesFixture: CategorySummary[] = DEFAULT_CATEGORIES.flatMap((definition) => {
  const rootId = fixtureUuid(`${definition.kind}-${slug(definition.name)}`);
  return [
    {
      id: rootId,
      parentId: null,
      name: definition.name,
      kind: definition.kind,
      icon: definition.icon,
      color: definition.color,
      archived: false,
    },
    ...(definition.children ?? []).map((child) => ({
      id: fixtureUuid(`${definition.kind}-${slug(definition.name)}-${slug(child)}`),
      parentId: rootId,
      name: child,
      kind: definition.kind,
      icon: definition.icon,
      color: definition.color,
      archived: false,
    })),
  ];
});
