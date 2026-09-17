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
  'category-beauty',
  'category-debt',
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

/**
 * Conjunto semeado em todo espaço novo. Espaços existentes receberam pelas migrations
 * `seed_default_categories` (0004), `seed_default_subcategories` (0010) e
 * `seed_more_default_categories` (0011).
 */
export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  {
    name: 'Moradia',
    kind: 'expense',
    icon: 'category-home',
    color: '#6366F1',
    children: [
      'Aluguel',
      'Condomínio',
      'Energia',
      'Água',
      'Internet',
      'Manutenção',
      'Gás',
      'IPTU',
      'Hipoteca',
      'Móveis',
      'Eletrodomésticos',
      'Reparos',
      'Taxas',
      'Água mineral',
      'Diarista',
      'Celular e internet móvel',
    ],
  },
  { name: 'Mercado', kind: 'expense', icon: 'category-market', color: '#16A34A' },
  {
    name: 'Alimentação',
    kind: 'expense',
    icon: 'category-food',
    color: '#EA580C',
    children: [
      'Restaurantes',
      'Delivery',
      'Padaria e café',
      'Açougue',
      'Bares',
      'Fast food',
      'Hortifruti',
      'Pescados',
      'Conveniência',
    ],
  },
  {
    name: 'Transporte',
    kind: 'expense',
    icon: 'category-transport',
    color: '#0EA5E9',
    children: [
      'Combustível',
      'Aplicativos',
      'Transporte público',
      'Estacionamento',
      'Manutenção do carro',
      'Consórcio',
      'IPVA',
      'Licenciamento',
      'Seguro do carro',
      'Multas',
      'Pedágios',
      'Lavagem',
      'Passagens',
      'Outros transportes',
    ],
  },
  {
    name: 'Saúde',
    kind: 'expense',
    icon: 'category-health',
    color: '#DC2626',
    children: [
      'Plano de saúde',
      'Farmácia',
      'Consultas e exames',
      'Plano odontológico',
      'Convênios',
      'Particular',
      'Emergências',
      'Terapias',
      'Academia',
      'Barbearia',
      'Dentista',
    ],
  },
  {
    name: 'Educação',
    kind: 'expense',
    icon: 'category-education',
    color: '#7C3AED',
    children: ['Escola', 'Inglês', 'Cursos', 'Faculdade', 'Pós-graduação', 'Material escolar'],
  },
  {
    name: 'Lazer',
    kind: 'expense',
    icon: 'category-leisure',
    color: '#DB2777',
    children: [
      'Viagens',
      'Passeios',
      'Hobbies',
      'Cinema',
      'Teatro',
      'Shows',
      'Festas',
      'Festivais',
      'Futebol',
      'Churrasco',
      'Parques e eventos',
    ],
  },
  {
    name: 'Assinaturas',
    kind: 'expense',
    icon: 'category-subscriptions',
    color: '#0891B2',
    children: ['Netflix', 'Spotify', 'Disney+', 'Prime Video', 'Max', 'Globoplay', 'YouTube Premium'],
  },
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
    children: ['Tarifas bancárias', 'Impostos', 'INSS', 'DAS', 'Contador'],
  },
  {
    name: 'Bem-estar e estética',
    kind: 'expense',
    icon: 'category-beauty',
    color: '#0D9488',
    children: ['Salão de beleza', 'Depilação', 'Manicure', 'Produtos estéticos'],
  },
  {
    name: 'Dívidas e crediários',
    kind: 'expense',
    icon: 'category-debt',
    color: '#DC2626',
    children: ['Empréstimos', 'Crediário de lojas', 'Renegociações'],
  },
  {
    name: 'Outras despesas',
    kind: 'expense',
    icon: 'category-other',
    color: '#64748B',
    children: ['Ajuda familiar', 'Doações', 'Imprevistos', 'Presentes'],
  },
  { name: 'Salário', kind: 'income', icon: 'category-salary', color: '#16A34A' },
  { name: 'Rendimentos', kind: 'income', icon: 'category-investments', color: '#0D9488' },
  { name: 'Reembolsos', kind: 'income', icon: 'category-refund', color: '#0EA5E9' },
  { name: 'Outras receitas', kind: 'income', icon: 'category-other', color: '#65A30D' },
  { name: 'Freelas', kind: 'income', icon: 'category-business', color: '#7C3AED' },
  { name: 'Renda extra', kind: 'income', icon: 'category-salary', color: '#0891B2' },
  { name: 'Hora extra', kind: 'income', icon: 'category-salary', color: '#6366F1' },
  { name: 'Pró-labore', kind: 'income', icon: 'category-business', color: '#475569' },
  { name: 'Cashback', kind: 'income', icon: 'category-refund', color: '#CA8A04' },
  { name: 'Resgates', kind: 'income', icon: 'category-investments', color: '#0D9488' },
  { name: 'FGTS', kind: 'income', icon: 'category-business', color: '#EA580C' },
  { name: 'Venda de bens', kind: 'income', icon: 'category-shopping', color: '#92400E' },
  { name: 'Doações recebidas', kind: 'income', icon: 'category-gifts', color: '#DB2777' },
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
