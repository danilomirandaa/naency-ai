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
- [x] Login por link mágico (`/entrar`, `/auth/callback`), perfil criado no primeiro acesso e sair
- [x] `proxy` protegendo `app/(app)`, com destino preservado e validado
- [x] `requireUser` e `requireMembership` com testes por papel (unitários e integração)
- [x] Testes de integração do DAL com PGlite (sem Docker) e cobertura mínima na CI
- [ ] Login com Google (ativar o provedor no Supabase; a tela já suporta)
- [x] Provider do TanStack Query (`app/(app)/providers.tsx`), `makeQueryClient` e `fetchJson`; primeiro contrato em `features/accounts/api`
- [x] Criar espaço (`/comecar`), espaço ativo em cookie e seletor de espaços na sidebar
- [x] `lib/money.ts` e `lib/dates.ts` com testes unitários
- [x] `components/finance`: `MoneyValue`, `MoneyInput`, `MemberAvatar`, com stories e testes
- [x] `InstitutionLogo`, `AccountAvatar`; `ui/List`, `ui/Select`, `ui/Popover`, `ui/Calendar` e `ui/DatePicker` (shadcn)
- [x] `MoneyInput` formatando enquanto digita (`maskMoneyInput`)
- [x] `Button` e `Spinner` do shadcn (efeito ao pressionar), com story

## Fase 1 · Núcleo financeiro

- [x] Catálogo de instituições (seed na migration `0002`; formatos e instruções de exportação na Fase 3)
- [x] Contas: criar, editar, arquivar, página `/contas` e contas reais na sidebar, com testes por papel
- [x] Saldo somando os lançamentos efetivados a partir da data do saldo inicial
- [x] Categorias: conjunto padrão (espaços novos e existentes), CRUD em dois níveis, arquivar, `CategoryIcon` e `CategorySelect`
- [x] Lançamentos: receita, despesa e transferência (duas pernas), previsto/efetivado, exclusão lógica
- [x] Página de Transações: filtros na URL (mês, conta, categoria com subcategorias, busca), rotas por tipo, resumo do período, paginação
- [x] Transações em tabela (lista por dia no celular): situação (atrasada/a pagar/paga), forma de pagamento, pago em, recorrente/parcela, ordenação por coluna, filtro rápido de situação com contador de atrasadas, resumo por situação em Receitas e Despesas
- [x] Convite de membro por link, aceite e página de membros
- [x] Gestão de papéis: trocar papel, remover membro, sair do espaço e regra do último admin (checada na transação)

## Fase 2 · Cartões

- [x] Cartão como tipo de conta: fechamento, vencimento, limite e conta de pagamento; tipo cartão não muda depois
- [x] Faturas criadas sob demanda pela data de fechamento, total calculado, status derivado; páginas /cartoes e /cartoes/[id]
- [x] Compras parceladas (até 48x, sobra na 1ª parcela, uma por fatura; excluir remove a compra inteira)
- [x] Pagamento de fatura como transferência, com desfazer

## Fase 3 · Importação e onboarding

**Precisa do usuário**: extratos reais do Nubank (conta e cartão), XP e pelo menos
mais um banco, em PDF, CSV e OFX, colocados em `.samples/`.

- [x] Onboarding como checklist no dashboard (contas → importar → convidar), retomável
- [x] `import_batches`/`import_rows`: o arquivo é lido no navegador e revisado antes de virar lançamento (Storage fica para PDF)
- [x] Leitores OFX (1.x SGML e 2.x XML) e CSV (Nubank conta, Nubank cartão, genérico com valor ou débito/crédito), Windows-1252, com testes
- [ ] Mapeamento de CSV desconhecido e extração de PDF com AI — precisa de `ANTHROPIC_API_KEY` e extratos reais
- [x] Memória de categorização ("lembrar para os próximos") e deduplicação (impressão digital + mesmo valor em ±2 dias)
- [x] Enriquecimento com AI (nome limpo e categoria) na revisão da importação, validado contra as categorias do espaço; liga com `ANTHROPIC_API_KEY`
- [x] Tela de revisão (/importar): incluir/excluir, categoria, lembrar, duplicados; importar em transação única e descartar
- [ ] Eval Opus 5 × Sonnet 5 com as amostras e escolha do modelo por tarefa
- [ ] Validar limites de duração da Vercel (fila se necessário)
- [x] Registro de consumo de AI (`ai_usage_events`: tarefa, modelo, tokens)

## Fase 4 · Dashboard e atividade

- [x] Blocos do [dashboard](./dashboard.md): resultado do mês com comparação, categorias (com subcategorias), evolução de 6 meses, saldos e dívida de cartões, a vencer (previstos e faturas), últimos lançamentos e checklist de configuração; seletor de mês na URL; uma query por bloco
- [x] "O que mudou": últimos lançamentos com quem lançou
- [ ] `activity_log` para ações além de lançamentos (importações, convites, pagamentos)

## Fase 5 · Planejamento e assistente

- [x] Recorrências (mensal, semanal, anual) gerando previstos por 45 dias, idempotente; pausar, editar só o futuro, excluir; página /transacoes/recorrentes
- [x] Orçamentos mensais por categoria principal (/planejamento/orcamentos) e metas ligadas ao saldo de uma conta (/planejamento/metas)
- [ ] Assistente de AI: perguntas sobre os dados do espaço, com ferramentas somente leitura
- [ ] Insights automáticos no dashboard

## Extras entregues

- [x] /configuracoes: renomear espaço (admin), estado e consumo da AI, créditos
- [x] /relatorios: resultado do mês, evolução de 12 meses e categorias
- [x] Avisos: toast (`components/ui/Toast`), sino no header derivado dos dados (importações, contas atrasadas, faturas fechadas) e notificação do navegador quando um job termina fora da aba ([componentes](./components.md#avisos-toast-e-sino))

## Antes do lançamento público

- [x] Crédito dos ícones (CC BY 4.0) visível no produto (Configurações → Sobre)
- [ ] Política de retenção de dados da AI documentada e informada na importação
