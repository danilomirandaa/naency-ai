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
- [ ] Rodar o workflow **Atualizar baselines visuais** para gerar os baselines Linux
- [ ] Proteção da branch `main` exigindo os jobs da CI

## Fase 0b · Fundação

- [x] Projeto Supabase criado e variáveis públicas configuradas
- [x] Clientes do Supabase (navegador e servidor) e renovação de sessão no `proxy`, com testes
- [x] Drizzle configurado, cliente do banco e migrations versionadas (checagem na CI)
- [x] Schema de `profiles`, `workspaces`, `workspace_members`, `workspace_invitations`, com RLS
- [x] Matriz de permissões por papel (`lib/permissions.ts`) com testes
- [x] Conexões `DATABASE_URL`/`DATABASE_MIGRATION_URL` configuradas
- [x] Migration `0000` aplicada no Supabase; RLS confirmado (escrita anônima negada pela API)
- [ ] Drizzle + migrations; Supabase local para testes de integração
- [x] Login por link mágico (`/entrar`, `/auth/callback`), perfil criado no primeiro acesso e sair
- [x] `proxy` protegendo `app/(app)`, com destino preservado e validado
- [x] `requireUser` e `requireMembership` com testes por papel (unitários e integração)
- [x] Testes de integração do DAL com PGlite (sem Docker) e cobertura mínima na CI
- [ ] Login com Google (ativar o provedor no Supabase; a tela já suporta)
- [x] Provider do TanStack Query (`app/(app)/providers.tsx`), `makeQueryClient` e `fetchJson`; primeiro contrato em `features/accounts/api`
- [x] Criar espaço (`/comecar`), espaço ativo em cookie e seletor de espaços na sidebar
- [x] `lib/money.ts` e `lib/dates.ts` com testes unitários
- [x] `components/finance`: `MoneyValue`, `MoneyInput`, `MemberAvatar`, com stories e testes
- [x] `DateInput`, `InstitutionLogo`, `AccountAvatar`; `ui/List` e `ui/NativeSelect`
- [ ] Gerenciar papéis: trocar papel, remover membro, regra do último admin

## Fase 1 · Núcleo financeiro

- [x] Catálogo de instituições (seed na migration `0002`; formatos e instruções de exportação na Fase 3)
- [x] Contas: criar, editar, arquivar, página `/contas` e contas reais na sidebar, com testes por papel
- [ ] Saldo somando os lançamentos (entra com os lançamentos)
- [ ] Categorias: seed padrão e CRUD
- [ ] Lançamentos: CRUD de receita, despesa e transferência
- [ ] Página de Transações (filtros por período, conta, categoria, tipo)
- [x] Convite de membro por link, aceite e página de membros
- [ ] Gestão de papéis (mudar papel, remover membro, regra do último admin)

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
