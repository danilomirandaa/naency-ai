# Arquitetura

Decisões que valem para o sistema inteiro. Mudar qualquer uma delas é uma
decisão explícita: atualize este arquivo no mesmo PR.

Leia junto: [domínio](./domain.md) · [componentes](./components.md) ·
[testes](./testing.md) · [importação](./import-and-onboarding.md) ·
[roadmap](./roadmap.md).

## Decisões

| Tema | Decisão | Por quê | Revisitar quando |
| --- | --- | --- | --- |
| Framework | Next.js 16 (App Router) | Server Components, Server Actions e Route Handlers no mesmo projeto | — |
| Banco, login e arquivos | **Supabase** (Postgres + Auth + Storage) | Um serviço cobre as três necessidades, com plano gratuito | Custo ou limite do plano |
| Acesso ao banco | **Drizzle ORM**, só no servidor | Schema e migrations tipados em TypeScript, SQL previsível | — |
| Dados no cliente | **TanStack Query** | Cache, refetch, mutations otimistas e polling de jobs com uma API só | — |
| Contrato de dados | **Zod** em `features/<feature>/schemas.ts` | Uma definição valida form, Server Action e Route Handler, e gera os tipos | — |
| RPC (tRPC, GraphQL) | **Não usar** | Os schemas Zod compartilhados já dão tipagem de ponta a ponta | App mobile ou API pública |
| Formulários | `useActionState` + Server Action, validando com os mesmos `schemas.ts` | Funciona sem JS extra e o erro volta com o que foi digitado | Formulário com muitos campos dinâmicos (aí, React Hook Form) |
| Compartilhamento | **Espaço com papéis** (ver [domínio](./domain.md#identidade-e-compartilhamento)) | Os dados pertencem ao espaço, não à pessoa; cada membro entra com a própria conta | — |
| AI | **Claude API**, modelo configurável por tarefa | Lê PDF nativamente e tem saída estruturada validada por Zod | Resultado do eval de importação |
| Hospedagem | **Vercel** | Integração nativa com Next | Limite de duração de função na importação |
| Componentização | **Obrigatória** ([componentes](./components.md)) | Consistência e reuso desde o início | — |
| Testes | **Obrigatórios** ([testes](./testing.md)) | Toda feature sobe provando que nada existente mudou | — |

## Estrutura de pastas

```
app/
  (auth)/                         login, aceite de convite
  (onboarding)/                   primeira configuração do espaço
  (app)/                          páginas com sidebar
    layout.tsx                    Sidebar.Provider + AppSidebar + providers
    providers.tsx                 QueryClientProvider + ToastProvider
  api/workspaces/[workspaceId]/   Route Handlers de leitura (GET) para o TanStack Query
components/
  ui/                             design system genérico
  finance/                        peças de domínio reutilizáveis entre features
  layout/                         casca do app (sidebar, header, tema)
features/<feature>/               accounts, transactions, cards, categories, imports, dashboard,
                                  notifications, planning, reports, workspaces
  api/<feature>.queries.ts        contratos de query (key + options + tag)
  actions.ts                      Server Actions ('use server'), finas, delegam ao DAL
  schemas.ts                      Zod: entrada e saída da feature
  types.ts                        DTOs (só tipos JSON: passam pela hidratação e pela API)
  components/                     composições da feature (com story)
  containers/                     ligam hooks de query e actions aos componentes, sem markup próprio
  fixtures/                       dados de exemplo para stories
server/                           tudo aqui importa 'server-only'
  db/client.ts                    conexão Drizzle
  db/schema/*.ts                  tabelas
  dal/*.ts                        Data Access Layer: autenticação, autorização, DTOs
  auth.ts                         sessão Supabase, getCurrentUser()
  ai/                             cliente Claude, tarefas, modelo por tarefa
  import/                         parsers OFX/CSV, extração de PDF, pipeline
  storage.ts                      Supabase Storage
lib/
  money.ts                        centavos ↔ exibição em BRL
  dates.ts                        datas no fuso America/Sao_Paulo
hooks/                            hooks genéricos de UI
tests/                            e2e/ e visual/ (ver testes)
```

Componentes de uma feature nunca importam de outra: o que for compartilhado sobe
para `components/finance/`, `lib/` ou `server/`. A exceção são os **containers**,
que podem usar o contrato de query, os tipos e as fixtures de outra feature para
compor ou invalidar (ex.: `ImportJobsWatcher` invalida `transactionsQuery` e
`accountsQuery` quando a importação entra).

## Fluxo de dados

Segue os guias oficiais da versão instalada:
`node_modules/next/dist/docs/01-app/02-guides/client-side-data-fetching/tanstack-query.md`
e `node_modules/next/dist/docs/01-app/02-guides/data-security.md`.

```
LEITURA INICIAL   page.tsx (Server Component) ──► DAL ──► prefetchQuery ──► HydrationBoundary
LEITURA CLIENTE   componente ──► useQuery(contrato) ──► Route Handler GET ──► DAL ──► Postgres
ESCRITA           componente ──► useMutation ──► Server Action ──► DAL ──► Postgres
                                        └─► invalidateQueries(keys afetadas)
```

### Contrato de query

Cada feature declara key, options e tag em um lugar só. O servidor (prefetch) e o
cliente (hook) importam o mesmo contrato, então a key nunca diverge.

```ts
// features/transactions/api/transactions.queries.ts
export const transactionsQuery = {
  key: (workspaceId: string, filters: TransactionFilters) =>
    ['workspace', workspaceId, 'transactions', filters] as const,
  options: (workspaceId: string, filters: TransactionFilters) =>
    queryOptions({
      queryKey: transactionsQuery.key(workspaceId, filters),
      queryFn: () => fetchJson(`/api/workspaces/${workspaceId}/transactions`, filters),
    }),
};
```

Regras:

- Toda key começa com `['workspace', workspaceId, …]`. Trocar de espaço nunca
  mostra dado de outro espaço, e invalidar um espaço inteiro é uma linha só.
- Defaults do `QueryClient`: `staleTime` de 30s e `refetchOnWindowFocus` ligado.
  Quem só acompanha vê o que o outro membro lançou ao voltar para a aba.
- Mutation invalida as keys que afetou. Atualização otimista só em ações simples
  e reversíveis (ex.: marcar como pago).
- Polling (`refetchInterval`) só enquanto houver um job em andamento, como a importação.
- Componentes não chamam `fetch` direto; usam hooks da feature.
- O `queryFn` do cliente usa `fetchJson` (`lib/api/fetch-json.ts`). No servidor, a
  página chama `prefetchQuery` sobrescrevendo o `queryFn` pelo DAL e passa o estado
  ao `HydrationBoundary` (exemplo: `app/(app)/contas/page.tsx`).
- Depois de uma escrita, a Server Action chama `revalidatePath('/', 'layout')`
  (a sidebar também mostra dados) e o container invalida `contrato.all(workspaceId)`.
- Route Handlers convertem erros do DAL com `errorResponse` (`server/http/errors.ts`):
  401 sem sessão, 403 sem permissão, e o resto vira 500 sem expor a mensagem.

### Server Actions e Route Handlers

- **Leitura** pelo cliente: Route Handler `GET` que valida os parâmetros com Zod e chama o DAL.
- **Escrita**: Server Action que valida a entrada com Zod e chama o DAL. A action
  não contém regra de negócio nem SQL.
- Retornam só DTOs (o necessário para a tela), nunca a linha crua do banco.

### Trabalho depois da resposta

Nada que demora prende a tela. Importar e sugerir categorias com AI seguem este
desenho:

1. A action marca o lote como processando (`startImportJob`) e **responde na hora**.
2. O trabalho roda dentro de `after()` (de `next/server`), já fora da resposta.
3. No fim, `finishImportJob(workspaceId, batchId, erro?)` limpa a marca e grava
   o erro, se houve.

Quem observa é o `ImportJobsWatcher`, montado no layout de `app/(app)`: ele
consulta a lista de lotes a cada 3s **enquanto existe algum processando** e para
sozinho depois. Como o estado está no banco e não na memória do navegador, a
pessoa pode dar F5, trocar de tela ou fechar a aba sem perder nada — ao voltar,
o aviso continua lá. Quando o lote termina, o watcher invalida as queries
afetadas (transações, contas, cartões e os avisos do sino).

Não usamos Service Worker: o trabalho é do servidor, não do navegador. O que a
aba faz é só perguntar como está, e a notificação do SO (com permissão) cobre o
caso de a pessoa estar em outra aba.

## Segurança

- **Autorização acontece no DAL e só nele.** Toda função do DAL recebe o
  `workspaceId` e chama `requireMembership(workspaceId, papelMínimo)` antes de ler
  ou escrever. Server Action e Route Handler não decidem permissão.
- `process.env`, o cliente do banco e a chave da AI só existem dentro de `server/`,
  e todo arquivo lá importa `'server-only'`. Única exceção: as variáveis
  `NEXT_PUBLIC_SUPABASE_*`, lidas e validadas em `lib/supabase/env.ts`, porque o
  Next só as embute no navegador quando acessadas diretamente.
- **RLS ligado em todas as tabelas** do Supabase com política *deny-all* para os
  papéis `anon` e `authenticated`. O navegador usa o Supabase só para login; os
  dados passam pelo servidor. Mesmo que a chave pública vaze, ela não lê nada.
- Arquivos de extrato ficam em bucket **privado**, com upload por URL assinada.
- **Sessão**: `proxy.ts` (o antigo middleware, no Next 16) chama
  `server/supabase/session.ts`, que renova o token a cada requisição e marca como
  não cacheável a resposta que grava cookie de sessão. Clientes do Supabase:
  `lib/supabase/client.ts` (navegador) e `server/supabase/client.ts` (servidor),
  ambos só para autenticação.
- **Rotas protegidas**: o `proxy` redireciona quem não tem sessão para `/entrar`
  (guardando o destino em `?next=`) e quem já tem sessão para fora do login. Regras
  em `lib/auth/routes.ts`, que também valida o `next` contra redirecionamento aberto.
  É uma checagem otimista: `app/(app)/layout.tsx` chama `requireUser()` e o DAL
  chama `requireMembership()` (ver `node_modules/next/dist/docs/01-app/02-guides/authentication.md`).
- **`/api/` nunca redireciona**: o `proxy` deixa passar, o Route Handler responde
  **401 em JSON** e o `fetchJson` manda o navegador para `/entrar?next=…`. Redirecionar
  faria o `fetch` receber o HTML do login e quebrar ao ler o JSON — a tela mostrava
  "não foi possível carregar" até recarregar a página.
- **Login**: link mágico por e-mail (`features/auth/actions.ts`). O link volta em
  `/auth/callback`, que troca o código pela sessão, cria o `profile` no primeiro
  acesso e redireciona. No painel do Supabase, **Authentication → URL
  Configuration** precisa listar o endereço do app (local e produção) em Redirect URLs.

## Banco e migrations

- Schema em `server/db/schema/`, uma área por arquivo, exportado por `index.ts`.
- **Toda tabela usa `.enableRLS()` sem policies.** No Supabase, tabela em `public`
  sem RLS fica legível pela API pública com a chave publishable.
- Mudou o schema: `npm run db:generate` gera a migration em `server/db/migrations/`,
  que é commitada. A CI falha se o schema mudar sem migration.
- `npm run db:migrate` aplica as migrations pendentes (usa `DATABASE_MIGRATION_URL`).
- Senha com caractere especial (`#`, `@`, `/`, `?`, `:`) precisa estar codificada na
  URL (ex.: `#` → `%23`), senão a conexão falha com "Invalid URL".
- Cliente em `server/db/client.ts` (`getDb()`), só no servidor.

## Espaço ativo

O usuário pode participar de mais de um espaço. O espaço ativo fica no cookie
`naency_workspace` e é trocado pelo `WorkspaceSwitcher` no topo da sidebar. A cada
requisição, `getActiveWorkspace()` (`server/dal/workspaces.ts`) cruza o cookie com os
espaços em que o usuário é membro: cookie inválido cai no primeiro espaço, e sem
nenhum espaço o layout redireciona para `/comecar`, onde a pessoa cria o primeiro
(e vira `admin`). Trocar de espaço passa por `requireMembership`.

## Convenções de dados

| Assunto | Regra |
| --- | --- |
| Dinheiro | **Centavos inteiros** (`bigint`), com sinal: saída negativa, entrada positiva. Nunca `float`. Conversão e exibição só via `lib/money.ts` |
| Moeda | Coluna `currency` existe (padrão `BRL`); por enquanto só BRL |
| Data do lançamento | Tipo `date` (sem hora) |
| Momento de sistema | `timestamptz` |
| Fuso de negócio | `America/Sao_Paulo`, via `lib/dates.ts` (define "este mês" e o fechamento de fatura) |
| Exclusão | Soft delete (`deleted_at`) em dados financeiros |
| Autoria | `created_by` e `updated_by` em toda entidade editável |
| IDs | UUID |
| Idioma | Código e banco em inglês; interface em pt-BR |

## Variáveis de ambiente

Ficam em `.env.local` (fora do git) e, em produção, nas variáveis da Vercel.
Nomes:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | App: Drizzle pelo pooler do Supabase em modo transação (porta 6543) |
| `DATABASE_MIGRATION_URL` | Migrations: mesmo host em modo sessão (porta 5432) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Login e sessão (RLS impede leitura de dados) |
| `SUPABASE_SECRET_KEY` | Storage e administração, só no servidor |
| `ANTHROPIC_API_KEY` | Claude API |
| `AI_MODEL_EXTRACT`, `AI_MODEL_ENRICH` | Modelo por tarefa (padrão `claude-opus-5`) |

## Período global

O período fica no header (`HeaderPeriodPicker`), nas telas que dependem dele
(`isPeriodPath`: Visão geral, Transações, Relatórios, Orçamentos). A regra é a mesma
no servidor e no cliente (`resolveRange` em `lib/periods.ts`): URL (`?de=&ate=` ou
`?mes=`) → cookie `naency_periodo` (último período escolhido) → mês atual. Ao mudar,
o header grava o cookie e troca os parâmetros da página atual. Páginas do servidor
usam `getPagePeriod` (`server/period.ts`) e passam o cookie para o container.
