/** Categorias (docs/domain.md): dois níveis, receita ou despesa. */
export const CATEGORY_KINDS = ['expense', 'income'] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const CATEGORY_KIND_LABELS: Record<CategoryKind, string> = {
  expense: 'Despesas',
  income: 'Receitas',
};

/** Ícones que uma categoria pode usar (mapeados no registro de ícones da UI). */
export const CATEGORY_ICONS = [
  'category-home',
  'category-market',
  'category-food',
  'category-transport',
  'category-fuel',
  'category-health',
  'category-education',
  'category-leisure',
  'category-travel',
  'category-subscriptions',
  'category-shopping',
  'category-clothes',
  'category-pets',
  'category-gifts',
  'category-bills',
  'category-energy',
  'category-water',
  'category-internet',
  'category-phone',
  'category-fitness',
  'category-kids',
  'category-salary',
  'category-investments',
  'category-refund',
  'category-business',
  'category-other',
] as const;
export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

/** Paleta das categorias. Texto e ícone sobre a cor usam `readableTextColor`. */
export const CATEGORY_COLORS = [
  '#6366F1',
  '#0EA5E9',
  '#0891B2',
  '#0D9488',
  '#16A34A',
  '#65A30D',
  '#CA8A04',
  '#EA580C',
  '#DC2626',
  '#DB2777',
  '#7C3AED',
  '#92400E',
  '#475569',
  '#64748B',
] as const;

export type CategoryDefinition = {
  name: string;
  kind: CategoryKind;
  icon: CategoryIconName;
  color: (typeof CATEGORY_COLORS)[number];
  children?: string[];
};

/** Conjunto semeado em todo espaço novo (e nos existentes, pela migration 0004). */
export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  {
    name: 'Moradia',
    kind: 'expense',
    icon: 'category-home',
    color: '#6366F1',
    children: ['Aluguel', 'Condomínio', 'Energia', 'Água', 'Internet', 'Manutenção'],
  },
  { name: 'Mercado', kind: 'expense', icon: 'category-market', color: '#16A34A' },
  {
    name: 'Alimentação',
    kind: 'expense',
    icon: 'category-food',
    color: '#EA580C',
    children: ['Restaurantes', 'Delivery', 'Padaria e café'],
  },
  {
    name: 'Transporte',
    kind: 'expense',
    icon: 'category-transport',
    color: '#0EA5E9',
    children: ['Combustível', 'Aplicativos', 'Transporte público', 'Estacionamento', 'Manutenção do carro'],
  },
  {
    name: 'Saúde',
    kind: 'expense',
    icon: 'category-health',
    color: '#DC2626',
    children: ['Plano de saúde', 'Farmácia', 'Consultas e exames'],
  },
  { name: 'Educação', kind: 'expense', icon: 'category-education', color: '#7C3AED' },
  {
    name: 'Lazer',
    kind: 'expense',
    icon: 'category-leisure',
    color: '#DB2777',
    children: ['Viagens', 'Passeios', 'Hobbies'],
  },
  { name: 'Assinaturas', kind: 'expense', icon: 'category-subscriptions', color: '#0891B2' },
  {
    name: 'Compras',
    kind: 'expense',
    icon: 'category-shopping',
    color: '#CA8A04',
    children: ['Roupas', 'Eletrônicos', 'Casa e decoração'],
  },
  { name: 'Pets', kind: 'expense', icon: 'category-pets', color: '#92400E' },
  {
    name: 'Impostos e tarifas',
    kind: 'expense',
    icon: 'category-bills',
    color: '#475569',
    children: ['Tarifas bancárias', 'Impostos'],
  },
  { name: 'Outras despesas', kind: 'expense', icon: 'category-other', color: '#64748B' },
  { name: 'Salário', kind: 'income', icon: 'category-salary', color: '#16A34A' },
  { name: 'Rendimentos', kind: 'income', icon: 'category-investments', color: '#0D9488' },
  { name: 'Reembolsos', kind: 'income', icon: 'category-refund', color: '#0EA5E9' },
  { name: 'Outras receitas', kind: 'income', icon: 'category-other', color: '#65A30D' },
];

export type CategoryNode<T extends { id: string; parentId: string | null }> = T & {
  children: T[];
};

/**
 * Organiza a lista plana em categorias principais com suas subcategorias, na
 * ordem recebida. Subcategoria cujo pai não veio na lista é descartada.
 */
export function buildCategoryTree<T extends { id: string; parentId: string | null }>(
  categories: T[],
): CategoryNode<T>[] {
  const roots = categories
    .filter((category) => category.parentId === null)
    .map((category) => ({ ...category, children: [] as T[] }));
  const byId = new Map(roots.map((root) => [root.id, root]));
  for (const category of categories) {
    if (category.parentId !== null) {
      byId.get(category.parentId)?.children.push(category);
    }
  }
  return roots;
}

/** "Moradia › Aluguel" ou só "Mercado". */
export function categoryPath(
  category: { name: string; parentId: string | null },
  byId: Map<string, { name: string }>,
) {
  const parent = category.parentId ? byId.get(category.parentId) : undefined;
  return parent ? `${parent.name} › ${category.name}` : category.name;
}
