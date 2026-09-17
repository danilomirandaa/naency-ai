-- Catálogo global de instituições (workspace_id nulo). Formatos de importação e
-- instruções de exportação entram na Fase 3, validados com extratos reais.
INSERT INTO "institutions" ("slug", "name", "kind", "compe_code", "color") VALUES
  ('nubank', 'Nubank', 'bank', '260', '#820AD1'),
  ('itau', 'Itaú', 'bank', '341', '#EC7000'),
  ('inter', 'Inter', 'bank', '077', '#FF7A00'),
  ('c6', 'C6 Bank', 'bank', '336', '#242424'),
  ('banco-do-brasil', 'Banco do Brasil', 'bank', '001', '#FCFC30'),
  ('caixa', 'Caixa', 'bank', '104', '#005CA9'),
  ('bradesco', 'Bradesco', 'bank', '237', '#CC092F'),
  ('santander', 'Santander', 'bank', '033', '#EC0000'),
  ('xp', 'XP Investimentos', 'broker', '102', '#000000'),
  ('carteira', 'Dinheiro/Carteira', 'wallet', NULL, '#2E7D32')
ON CONFLICT ("slug") DO NOTHING;
