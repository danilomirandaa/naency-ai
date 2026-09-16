# Roadmap

Fases em ordem. Toda fase segue as regras obrigatórias de
[componentização](./components.md) e [testes](./testing.md): uma entrega só está
pronta quando cumpre a **definição de pronto**.

## Fase 0a · Rede de segurança

Vem antes de qualquer feature, para que tudo o que vier depois já nasça testado.

- [x] Vitest 4, `@storybook/addon-vitest` e `@storybook/addon-a11y`, Playwright
- [x] Stories existentes rodando como testes, com `play` nas interações e a11y como erro
- [x] Stories para `components/layout` (AppSidebar, AppHeader, ThemeToggle)
- [x] Testes unitários da lógica existente (paginação, navegação, tema, classMerge)
- [x] Regressão visual de todas as stories em light e dark (baselines locais)
- [x] Workflow de CI (`.github/workflows/ci.yml`)
- [ ] Repositório no GitHub (hoje o projeto não tem remote) **— precisa do usuário**
- [ ] Rodar o workflow manualmente para gerar os **baselines Linux** e commitá-los
- [ ] Proteção da branch `main` exigindo os jobs da CI

## Fase 0b · Fundação

- [ ] Projeto Supabase criado **pelo usuário** e variáveis de ambiente configuradas
- [ ] Drizzle + migrations; Supabase local para testes de integração
- [ ] Auth: Google e link mágico; `proxy` protegendo `app/(app)`
- [ ] Schema de `profiles`, `workspaces`, `workspace_members`, `workspace_invitations`
- [ ] DAL de autorização (`requireMembership`) **com testes por papel**
- [ ] Provider do TanStack Query e helper de contrato de query
- [ ] Seletor de espaço no topo da sidebar
- [ ] `lib/money.ts` e `lib/dates.ts` com testes unitários
- [ ] `components/finance` base: `MoneyValue`, `MoneyInput`, `DateInput`, com stories e testes

## Fase 1 · Núcleo financeiro

- [ ] Catálogo de instituições (seed)
- [ ] Contas: CRUD e saldo calculado
- [ ] Categorias: seed padrão e CRUD
- [ ] Lançamentos: CRUD de receita, despesa e transferência
- [ ] Página de Transações (filtros por período, conta, categoria, tipo)
- [ ] Convite de membro, aceite e gestão de papéis

## Fase 2 · Cartões

- [ ] Detalhes do cartão (fechamento, vencimento, limite)
- [ ] Faturas: atribuição da compra pela data de fechamento e total calculado
- [ ] Compras parceladas
- [ ] Pagamento de fatura como transferência

## Fase 3 · Importação e onboarding

**Precisa do usuário**: extratos reais do Nubank (conta e cartão), XP e pelo menos
mais um banco, em PDF, CSV e OFX, colocados em `.samples/`.

- [ ] Onboarding (criar espaço, convidar, escolher bancos, importar, revisar)
- [ ] Upload para Storage e `import_batches`
- [ ] Parsers OFX e CSV de layouts conhecidos, com testes
- [ ] Mapeamento de CSV desconhecido e extração de PDF com AI
- [ ] Enriquecimento com AI, memória de categorização, deduplicação
- [ ] Tela de revisão e commit
- [ ] Eval Opus 5 × Sonnet 5 com as amostras e escolha do modelo por tarefa
- [ ] Validar limites de duração da Vercel (fila se necessário)
- [ ] Registro de consumo de AI

## Fase 4 · Dashboard e atividade

- [ ] Blocos do [dashboard](./dashboard.md)
- [ ] Feed de atividade entre membros

## Fase 5 · Planejamento e assistente

- [ ] Recorrências e contas a vencer
- [ ] Orçamentos e metas
- [ ] Assistente de AI: perguntas sobre os dados do espaço, com ferramentas somente leitura
- [ ] Insights automáticos no dashboard

## Antes do lançamento público

- [ ] Crédito dos ícones (CC BY 4.0) visível no produto ([créditos](./credits.md))
- [ ] Política de retenção de dados da AI documentada e informada na importação
