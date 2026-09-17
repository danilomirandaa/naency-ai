-- Categorias padrão (lib/categories.ts: DEFAULT_CATEGORIES) para espaços que ainda
-- não têm nenhuma. Espaços novos são semeados pelo DAL ao serem criados.
-- lib/categories.test.ts garante que esta lista é igual à do código.
WITH defaults(name, kind, icon, color, parent_name) AS (VALUES
  ('Moradia', 'expense', 'category-home', '#6366F1', NULL),
  ('Aluguel', 'expense', 'category-home', '#6366F1', 'Moradia'),
  ('Condomínio', 'expense', 'category-home', '#6366F1', 'Moradia'),
  ('Energia', 'expense', 'category-home', '#6366F1', 'Moradia'),
  ('Água', 'expense', 'category-home', '#6366F1', 'Moradia'),
  ('Internet', 'expense', 'category-home', '#6366F1', 'Moradia'),
  ('Manutenção', 'expense', 'category-home', '#6366F1', 'Moradia'),
  ('Mercado', 'expense', 'category-market', '#16A34A', NULL),
  ('Alimentação', 'expense', 'category-food', '#EA580C', NULL),
  ('Restaurantes', 'expense', 'category-food', '#EA580C', 'Alimentação'),
  ('Delivery', 'expense', 'category-food', '#EA580C', 'Alimentação'),
  ('Padaria e café', 'expense', 'category-food', '#EA580C', 'Alimentação'),
  ('Transporte', 'expense', 'category-transport', '#0EA5E9', NULL),
  ('Combustível', 'expense', 'category-transport', '#0EA5E9', 'Transporte'),
  ('Aplicativos', 'expense', 'category-transport', '#0EA5E9', 'Transporte'),
  ('Transporte público', 'expense', 'category-transport', '#0EA5E9', 'Transporte'),
  ('Estacionamento', 'expense', 'category-transport', '#0EA5E9', 'Transporte'),
  ('Manutenção do carro', 'expense', 'category-transport', '#0EA5E9', 'Transporte'),
  ('Saúde', 'expense', 'category-health', '#DC2626', NULL),
  ('Plano de saúde', 'expense', 'category-health', '#DC2626', 'Saúde'),
  ('Farmácia', 'expense', 'category-health', '#DC2626', 'Saúde'),
  ('Consultas e exames', 'expense', 'category-health', '#DC2626', 'Saúde'),
  ('Educação', 'expense', 'category-education', '#7C3AED', NULL),
  ('Lazer', 'expense', 'category-leisure', '#DB2777', NULL),
  ('Viagens', 'expense', 'category-leisure', '#DB2777', 'Lazer'),
  ('Passeios', 'expense', 'category-leisure', '#DB2777', 'Lazer'),
  ('Hobbies', 'expense', 'category-leisure', '#DB2777', 'Lazer'),
  ('Assinaturas', 'expense', 'category-subscriptions', '#0891B2', NULL),
  ('Compras', 'expense', 'category-shopping', '#CA8A04', NULL),
  ('Roupas', 'expense', 'category-shopping', '#CA8A04', 'Compras'),
  ('Eletrônicos', 'expense', 'category-shopping', '#CA8A04', 'Compras'),
  ('Casa e decoração', 'expense', 'category-shopping', '#CA8A04', 'Compras'),
  ('Pets', 'expense', 'category-pets', '#92400E', NULL),
  ('Impostos e tarifas', 'expense', 'category-bills', '#475569', NULL),
  ('Tarifas bancárias', 'expense', 'category-bills', '#475569', 'Impostos e tarifas'),
  ('Impostos', 'expense', 'category-bills', '#475569', 'Impostos e tarifas'),
  ('Outras despesas', 'expense', 'category-other', '#64748B', NULL),
  ('Salário', 'income', 'category-salary', '#16A34A', NULL),
  ('Rendimentos', 'income', 'category-investments', '#0D9488', NULL),
  ('Reembolsos', 'income', 'category-refund', '#0EA5E9', NULL),
  ('Outras receitas', 'income', 'category-other', '#65A30D', NULL)
),
targets AS (
  SELECT w.id FROM workspaces w
  WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.workspace_id = w.id)
),
roots AS (
  INSERT INTO categories (workspace_id, name, kind, icon, color)
  SELECT t.id, d.name, d.kind::category_kind, d.icon, d.color
  FROM targets t CROSS JOIN defaults d
  WHERE d.parent_name IS NULL
  RETURNING id, workspace_id, name, kind
)
INSERT INTO categories (workspace_id, parent_id, name, kind, icon, color)
SELECT r.workspace_id, r.id, d.name, d.kind::category_kind, d.icon, d.color
FROM roots r JOIN defaults d ON d.parent_name = r.name AND d.kind::category_kind = r.kind;
