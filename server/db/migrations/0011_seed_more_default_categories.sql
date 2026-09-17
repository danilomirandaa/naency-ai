-- Categorias padrão acrescentadas a partir da planilha de despesas da família
-- (lib/categories.ts). Mesmo critério do 0010: só espaços que já têm categorias,
-- e nomes que o espaço já usa ficam como estão (ON CONFLICT DO NOTHING).
WITH new_roots(name, kind, icon, color, parent_name) AS (VALUES
  ('Bem-estar e estética', 'expense', 'category-beauty', '#0D9488', NULL),
  ('Dívidas e crediários', 'expense', 'category-debt', '#DC2626', NULL)
)
INSERT INTO categories (workspace_id, name, kind, icon, color)
SELECT w.id, r.name, r.kind::category_kind, r.icon, r.color
FROM workspaces w CROSS JOIN new_roots r
WHERE EXISTS (SELECT 1 FROM categories c WHERE c.workspace_id = w.id)
ON CONFLICT DO NOTHING;
--> statement-breakpoint
WITH new_children(parent_name, kind, name) AS (VALUES
  ('Moradia', 'expense', 'Água mineral'),
  ('Moradia', 'expense', 'Diarista'),
  ('Moradia', 'expense', 'Celular e internet móvel'),
  ('Alimentação', 'expense', 'Conveniência'),
  ('Saúde', 'expense', 'Dentista'),
  ('Educação', 'expense', 'Pós-graduação'),
  ('Lazer', 'expense', 'Churrasco'),
  ('Lazer', 'expense', 'Parques e eventos'),
  ('Impostos e tarifas', 'expense', 'INSS'),
  ('Impostos e tarifas', 'expense', 'DAS'),
  ('Impostos e tarifas', 'expense', 'Contador'),
  ('Bem-estar e estética', 'expense', 'Salão de beleza'),
  ('Bem-estar e estética', 'expense', 'Depilação'),
  ('Bem-estar e estética', 'expense', 'Manicure'),
  ('Bem-estar e estética', 'expense', 'Produtos estéticos'),
  ('Dívidas e crediários', 'expense', 'Empréstimos'),
  ('Dívidas e crediários', 'expense', 'Crediário de lojas'),
  ('Dívidas e crediários', 'expense', 'Renegociações'),
  ('Outras despesas', 'expense', 'Ajuda familiar'),
  ('Outras despesas', 'expense', 'Doações'),
  ('Outras despesas', 'expense', 'Imprevistos'),
  ('Outras despesas', 'expense', 'Presentes')
)
INSERT INTO categories (workspace_id, parent_id, name, kind, icon, color)
SELECT p.workspace_id, p.id, d.name, p.kind, p.icon, p.color
FROM new_children d
JOIN categories p ON p.name = d.parent_name AND p.kind = d.kind::category_kind AND p.parent_id IS NULL
ON CONFLICT DO NOTHING;
