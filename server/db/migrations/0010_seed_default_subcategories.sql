-- Categorias padrão acrescentadas depois do 0004 (lib/categories.ts), inclusive as
-- trazidas do Naency antigo. Só para espaços que já tinham categorias semeadas;
-- nomes que o espaço já usa ficam como estão (ON CONFLICT DO NOTHING).
WITH new_roots(name, kind, icon, color, parent_name) AS (VALUES
  ('Freelas', 'income', 'category-business', '#7C3AED', NULL),
  ('Renda extra', 'income', 'category-salary', '#0891B2', NULL),
  ('Hora extra', 'income', 'category-salary', '#6366F1', NULL),
  ('Pró-labore', 'income', 'category-business', '#475569', NULL),
  ('Cashback', 'income', 'category-refund', '#CA8A04', NULL),
  ('Resgates', 'income', 'category-investments', '#0D9488', NULL),
  ('FGTS', 'income', 'category-business', '#EA580C', NULL),
  ('Venda de bens', 'income', 'category-shopping', '#92400E', NULL),
  ('Doações recebidas', 'income', 'category-gifts', '#DB2777', NULL)
)
INSERT INTO categories (workspace_id, name, kind, icon, color)
SELECT w.id, r.name, r.kind::category_kind, r.icon, r.color
FROM workspaces w CROSS JOIN new_roots r
WHERE EXISTS (SELECT 1 FROM categories c WHERE c.workspace_id = w.id)
ON CONFLICT DO NOTHING;
--> statement-breakpoint
WITH new_children(parent_name, kind, name) AS (VALUES
  ('Moradia', 'expense', 'Gás'),
  ('Moradia', 'expense', 'IPTU'),
  ('Moradia', 'expense', 'Hipoteca'),
  ('Moradia', 'expense', 'Móveis'),
  ('Moradia', 'expense', 'Eletrodomésticos'),
  ('Moradia', 'expense', 'Reparos'),
  ('Moradia', 'expense', 'Taxas'),
  ('Alimentação', 'expense', 'Açougue'),
  ('Alimentação', 'expense', 'Bares'),
  ('Alimentação', 'expense', 'Fast food'),
  ('Alimentação', 'expense', 'Hortifruti'),
  ('Alimentação', 'expense', 'Pescados'),
  ('Transporte', 'expense', 'Consórcio'),
  ('Transporte', 'expense', 'IPVA'),
  ('Transporte', 'expense', 'Licenciamento'),
  ('Transporte', 'expense', 'Seguro do carro'),
  ('Transporte', 'expense', 'Multas'),
  ('Transporte', 'expense', 'Pedágios'),
  ('Transporte', 'expense', 'Lavagem'),
  ('Transporte', 'expense', 'Passagens'),
  ('Transporte', 'expense', 'Outros transportes'),
  ('Saúde', 'expense', 'Plano odontológico'),
  ('Saúde', 'expense', 'Convênios'),
  ('Saúde', 'expense', 'Particular'),
  ('Saúde', 'expense', 'Emergências'),
  ('Saúde', 'expense', 'Terapias'),
  ('Saúde', 'expense', 'Academia'),
  ('Saúde', 'expense', 'Barbearia'),
  ('Educação', 'expense', 'Escola'),
  ('Educação', 'expense', 'Inglês'),
  ('Educação', 'expense', 'Cursos'),
  ('Educação', 'expense', 'Faculdade'),
  ('Educação', 'expense', 'Material escolar'),
  ('Lazer', 'expense', 'Cinema'),
  ('Lazer', 'expense', 'Teatro'),
  ('Lazer', 'expense', 'Shows'),
  ('Lazer', 'expense', 'Festas'),
  ('Lazer', 'expense', 'Festivais'),
  ('Lazer', 'expense', 'Futebol'),
  ('Assinaturas', 'expense', 'Netflix'),
  ('Assinaturas', 'expense', 'Spotify'),
  ('Assinaturas', 'expense', 'Disney+'),
  ('Assinaturas', 'expense', 'Prime Video'),
  ('Assinaturas', 'expense', 'Max'),
  ('Assinaturas', 'expense', 'Globoplay'),
  ('Assinaturas', 'expense', 'YouTube Premium')
)
INSERT INTO categories (workspace_id, parent_id, name, kind, icon, color)
SELECT p.workspace_id, p.id, d.name, p.kind, p.icon, p.color
FROM new_children d
JOIN categories p ON p.name = d.parent_name AND p.kind = d.kind::category_kind AND p.parent_id IS NULL
ON CONFLICT DO NOTHING;
